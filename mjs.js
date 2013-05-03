/*
	Mades JavaSctips Alpha-snippets
	Author: Andrei Bogarevich
	License:  MIT License
	Site: https://github.com/madeS/mjsa
	v0.5.0.47 Beta
	Last Mod: 2013-04-29 14:50
*/
var mjsa = new (function ($){
	var mthis = this; 
	// Defaults variables
	this.wait_message = undefined; // in easilyAjax - not recommended
	this.def = {
		testing: false,
		appMeetVersion: 500, // old application not supported
		bodyAjax: true,  //true, // set false for old application, and for not support body ajax server side
		bodyAjax_inselector: '#body_cont',  //body, 
		bodyAjaxOnloadFunc: undefined,  // reAttach events for dom and etc. 
		haSaveSelector: '.mjs_save', // history ajax save forms inputs selector
		hintsContClass: 'mjs_hints_container', //'mjs_hints_container', undefined for alerts warnings, else need connect mjsa css
		hintClass: 'mjs_hint',
		hintSuccess: 'mjs_hint_success',
		hintError: 'mjs_hint_error',
		hintSimple: 'mjs_hint_simple',
		hintLiveMs: 10000,
		htmlInterception: undefined
	};
	
	//  *** error message ***
	this.print_error = function(error_msg){
		return mthis.print_hint(error_msg,mthis.def.hintError);
	};
	this._createHintsContainer = function(){ 
		$('body').append('<div class="'+mthis.def.hintsContClass+'"></div>');
	};
	this.print_hint = function(hint,className){ 
		if (!mthis.def.hintsContClass) { alert('hint: '+hint); return false;}
		if (!className)  className = mthis.def.hintSimple;
		// rewrite with jQuery.delay
		var ms = new Date(); var ms_time = ms.getTime();
		if ($('.'+mthis.def.hintsContClass).length===0) mthis._createHintsContainer();
		$('.'+mthis.def.hintsContClass).append('<div class="hint'+ms_time+'" style="display:none; clear:left;"><div class="'+mthis.def.hintClass+' '+className+'">'+hint+'</div>');
		$('.'+mthis.def.hintsContClass).find('.hint'+ms_time).animate({height: "show"}, 300);
		window.setTimeout(function(){
			jQuery('.'+mthis.def.hintsContClass).find('.hint'+ms_time+'')
				.animate({height: "hide"},{duration:300,done:function(){$(this).remove();}});
		}, mthis.def.hintLiveMs);
		
		return false;
	};
	
	this.print_r = function(arr, level, maxlevel){
		if (!maxlevel) maxlevel = 5;
		if (level >= maxlevel) return '';
		var print_red_text = "";
		if (!level) level = 0;
		var level_padding = "";
		for(var j=0; j<level+1; j++) level_padding += "    ";
		if(typeof(arr)==='object') {
			for(var item in arr) {
				var value = arr[item];
				if(typeof(value)==='object') {
					print_red_text += level_padding + "'" + item + "' :\n";
					print_red_text += mthis.print_r(value,level+1,maxlevel);
				} else print_red_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		} else  print_red_text = "==>"+arr+"<==("+typeof(arr)+")";
		return print_red_text;
	};
	this.debug_param = function(e){alert(this.print_r(e));};
	this.debug = function(e){console.log('debugging:',e);};

	// *** selectable support ***
	this.jSelected = undefined;
	this.s = function(selector){mthis.jSelected = $(selector); return mthis;};
	
	// *** CircleTimer - easy stand alone timer ***
	this._circleTimerHandler = undefined;
	this._circleTimerCallback = function(){};
	this.circleTimer = function(callback,timer){
		if(mthis._circleTimerHandler){
			clearInterval(mthis._circleTimerHandler);
		}
		mthis._circleTimerCallback = callback;
		setInterval(mthis._circleTimerCallback, timer);
	};

	// *** inner x3 Ajax ***
	this._ajax_recurs = 3;
	this._ajax = function(options){
		newOptions = JSON.parse(JSON.stringify(options));
		var innerOptions = $.extend(newOptions,{
			success: function(html, textStatus, XMLHttpRequest){
				mthis._ajax_recurs = 3;
				if (options.success !== undefined) options.success(html, textStatus, XMLHttpRequest);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (mthis._ajax_recurs > 0) {
					mthis._ajax_recurs--;
					mthis._ajax(options);
				} else {
					mthis._ajax_recurs = 3;
					if (options.error !== undefined ) options.error(jqXHR, textStatus, errorThrown);
					else mthis.print_error('Error '+jqXHR.status+': '+jqXHR.statusText);
				}
			}
		});
		$.ajax(innerOptions);
	};
	
	// scroll to value in pixels
	this.scrollTo = function(value){
		var item =  $("html,body");
		if(typeof(value)==="number")  {
			item.animate({scrollTop: value});
		} else {
			var sct = $(value).offset().top;
			item.animate({scrollTop: sct});
		}
		return false;
	};
	
	// *** easily ajax ***
	// collects params
	this.collectParams = function(selector){
		if (selector === undefined) return {};
		var ret = {};
		$(selector).each(function(indx, element){
			if ($(this).val() && $(this).attr('name')) {
				if ($(this).is('input[type=checkbox]')){
					ret[$(this).attr('name')] = ($(this).is(':checked'))?'1':'0';
				} else if ($(this).is('input[type=radio]')) {
					if ($(this).is(':checked')) {
						ret[$(this).attr('name')] = $(this).val();
					} else {
						if (ret[$(this).attr('name')] === undefined) {
							ret[$(this).attr('name')] = '';
						}
					}
				} else if ($(this).is('[take=html]')) {
					ret[$(this).attr('name')] = $(this).html();
				} else {
					ret[$(this).attr('name')] = $(this).val();
				}
			}
		}); return ret;
	};
	this.loadCollectedParams = function(selector,collected){
		var el;
		for(var key in collected){
			el = $(selector+'[name='+key+']');
			if ((el.attr('type') === 'text') || el.is('textarea')) el.val(collected[key]);
			if (el.is('[take=html]')) el.html(collected[key]);
		}
	};
	// easilyPostAjax
	this.easilyPostAjax = function(url, insert_selector, post_obj, post_selector, add_callback, add_precall){
		if (post_obj === undefined) post_obj = {};
		var data = $.extend(post_obj,mthis.collectParams(post_selector));
		if (add_precall !== undefined) { 
			if (add_precall(data)) return false;
		}
		if ((mthis.wait_message !== undefined) && (insert_selector !== undefined)){
			$(insert_selector).html(mthis.wait_message);
		}
		mthis._ajax({
			url: url, type: 'POST', data: data,
			success:function(data) {
				if (insert_selector !== undefined) mthis.html(insert_selector,data);
				if (add_callback !== undefined) add_callback(data);
			}
		});
		return false;
	};
	// *** "HTML5 History" Body Ajax [BETA] ***
	this._get_ajaxShadow = function(){
		if($('.mjs_ajax_shadow').length === 0) $('body').append('<div class="mjs_ajax_shadow"></div>');
		return $('.mjs_ajax_shadow');
	};
	this.bodyAjax = function(link,opt){
		if (!opt) opt = {};
		var noajax = false; if (opt && opt.el) noajax = $(opt.el).attr('noajax');
		if ((link.indexOf('http') === 0) || !(window.history && history.pushState) || (noajax)) {
			if (mthis.def.testing) { //[testing]
				alert('not support html5, or link started from http, or NOAJAX: '+link);
				alert('link:'+link);
				alert('history:'+window.history);
				alert('history.pushState:'+window.history.pushState);
			}
			document.location.href = link; return false;
		}
		if (!$(mthis.def.bodyAjax_inselector).length){
			if (mthis.def.testing) alert('container not found'); // [testing]
			document.location.href = link; return false;
		}
		if (opt.pushonly) {
			if (!mthis.currentPathname === link){
				mthis.currentPathname = link;
				history.pushState({url:link,title:$('title').html()}, $('title').html(), link);
			}
			return false;
		}
		mthis._get_ajaxShadow().animate({opacity: "show"},200);
		mthis._ajax({
			url: link, type: 'GET', data: {body_ajax: 'true'},
			success:function(content){ 
				var collected = mthis.collectParams(mthis.def.haSaveSelector);
				var content_separated = undefined;
				if (content.indexOf('<ajaxbody_separator/>') !== -1) {
					content_separated = content.split('<ajaxbody_separator/>');
					if ((content_separated.length > 1)) { //  && (content.indexOf('<redirect_separator/>') === -1) [edit] something wrong with redirect 
														// [hint] redirect released on server side
						if (mthis.currentPathname === link) opt.nopush = true;
						mthis.currentPathname = link;
						if(!opt.nopush){
							history.pushState({url:link,title:content_separated[0]}, content_separated[0], link);
							mthis.scrollTo(0);
							document.title = content_separated[0];
						}
						mthis.html(mthis.def.bodyAjax_inselector,content_separated[1]);
						if (mthis.def.bodyAjaxOnloadFunc){
							mthis.def.bodyAjaxOnloadFunc();
						}
						if (opt.callback) opt.callback();
					}
				} else {
					mthis.html('body',content);
				}
				mthis.loadCollectedParams(mthis.def.haSaveSelector,collected);
				mthis._get_ajaxShadow().queue(function(){ $(this).animate({opacity: "hide"},200); $(this).dequeue();});
			},
			error:function(jqXHR, textStatus, errorThrown){
				mthis._get_ajaxShadow().queue(function(){$(this).animate({opacity: "hide"},200);$(this).dequeue();});
				mthis.print_error('Error '+jqXHR.status+': '+jqXHR.statusText);
			}
		});
	};
	this.bodyAjaxUpdate = function(){
		mthis.bodyAjax(location.pathname+location.search,{nopush:true,callback:function(){}});
	};
	this.currentPathname = '';
	this.bodyAjaxInit = function(selector){
		if (!selector) selector = 'a';
		if(!mthis.def.bodyAjax) {
			mthis.print_error('"Html 5 Body Ajax" disabled in MJS settings');
			return false;
		}
		$(document).on('click', selector, function(){
			if (($(this).attr('href') !== '#'))
				mthis.bodyAjax($(this).attr('href'),{el:this});
			return false;
		});
		mthis.currentPathname = location.pathname+location.search;
		if ((window.history && history.pushState)){
			window.addEventListener("popstate", function(e) {
				//alert(location.pathname+location.search +' - '+mthis.currentPathname);
				if (location.pathname+location.search !== mthis.currentPathname){
					mthis.bodyAjax(location.pathname+location.search,{nopush:true});//(e.url); not working :(
				}
				e.preventDefault();
			}, false);
		}
		return false;
	};

	// changing url brawser string, support bodyAjax
	this.location = function(link,opt){
		if (opt && opt.hash) {
			var addressString = document.location.href;
			if (addressString.indexOf("#",0) !== 1 ) {
				addressString = addressString.replace(new RegExp("(#[^#]*)", "i"), link);
			} else {
				link = addressString + link;
			}
			document.location.href = link;
			return false;
		}
		if (mthis.def.bodyAjax) {
			mthis.bodyAjax(link);
		} else {
			document.location.href = link;
		}
		return false;
	};
	// insert html with state look [redirect(test),alert,stop]
	this.html = function(selector,content){
		var jSel = $(selector);
		var needHtml = true;
		var content_separated = undefined;
		var par = undefined;
		if (mthis.def.appMeetVersion >= 300) {
			if (content.indexOf('<mjs_separator/>') === -1) { // quick end
				jSel.html(content);
				return jSel;
			} else {
				if (mthis.def.htmlInterception){
					if (!mthis.def.htmlInterception(content)) return jSel; // interception (like <redirect_separator/>/auth)
				}
			}
		} 
		if (content.indexOf('<redirect_separator/>') !== -1) {
			content_separated = content.split('<redirect_separator/>');
			if (content_separated.length > 1) {
				mthis.location(content_separated[1]);
			}
		}
		if (content.indexOf('<error_separator/>') !== -1) {
			content_separated = content.split('<error_separator/>');
			if (content_separated.length > 1) {
				mthis.print_error(content_separated[1]);
			}
		}
		if (content.indexOf('<success_separator/>') !== -1) {
			content_separated = content.split('<success_separator/>');
			if (content_separated.length > 1) {
				mthis.print_hint(content_separated[1],mthis.def.hintSuccess);
			}
		}
		if (content.indexOf('<alert_separator/>') !== -1) {
			content_separated = content.split('<alert_separator/>');
			if (content_separated.length > 1) {
				alert(content_separated[1]);
			}
		}
		if (content.indexOf('<html_replace_separator/>') !== -1) {
			content_separated = content.split('<html_replace_separator/>');
			if (content_separated.length > 1) {
				par = content_separated[1].split('<html_replace_to/>');
				if (par.length > 1){
					$(par[0]).html(par[1]);
				}
			}
		}
		if (content.indexOf('<html_append_separator/>') !== -1) {
			content_separated = content.split('<html_append_separator/>');
			if (content_separated.length > 1) {
				par = content_separated[1].split('<html_append_to/>');
				if (par.length > 1){
					$(par[0]).append(par[1]);
				}
			}
		}
		if (content.indexOf('<append_separator/>') !== -1) {
			content_separated = content.split('<append_separator/>');
			if (content_separated.length > 1){
				jSel.append(content_separated[1]);
				needHtml = false;
			}
		}
		if (content.indexOf('<html_prepend_separator/>') !== -1) {
			content_separated = content.split('<html_prepend_separator/>');
			if (content_separated.length > 1) {
				par = content_separated[1].split('<html_prepend_to/>');
				if (par.length > 1){
					$(par[0]).append(par[1]);
				}
			}
		}
		if (content.indexOf('<prepend_separator/>') !== -1) {
			content_separated = content.split('<prepend_separator/>');
			if (content_separated.length > 1){
				jSel.append(content_separated[1]);
				needHtml = false;
			}
		}
		if (content.indexOf('<stop_separator/>') !== -1) needHtml = false;
		if (needHtml) {
			jSel.html(content);
		}
		return jSel;
	};
	this.grabResponseTag = function(response,tag){
		if (response.indexOf(tag) !== -1) {
			var content_separated = response.split(tag);
			if (content_separated.length > 1) {
				return content_separated[1];
			}
		}
		return false;
	};
	
	// geoLocation by GPS 
	this._geoLocationDefCall = function(position){
		mthis.debug(position);
		mthis.debug_param(position);
	};
	// options = {
	//	timeout: 60000//milliseconds
	//	noLocationCall: function(){}
	//	notSupportCall: function(){} //
	//	accessDeniedCall: function(){} //
	//	unavailablePosCall: function(){}
	//	timeoutCall: function(){}
	//}
	this.geoLocation = function(func,options){
		if (!options) options = {};
		if (func===undefined) func = mthis._geoLocationDefCall;
		if (!options.timeout) options.timeout = 60000;
		if(!navigator.geolocation){
			if (options.notSupportCall) options.notSupportCall();
			if (options.noLocationCall) options.noLocationCall();
			return false;
		}
		navigator.geolocation.getCurrentPosition(
			func, function(err){
				mthis.debug(err);
				if(err.code === 1) {
					if (options.accessDeniedCall) options.accessDeniedCall();
				}else if( err.code === 2) {
					if (options.unavailablePosCall) options.unavailablePosCall();
				}else if( err.code === 3) {
					if (options.timeoutCall) options.timeoutCall();
				}
				if (options.noLocationCall) options.noLocationCall();
			},options
		);
		return false;
	};

	// [edit] upload files using File API
	
	//localStorage [test]
	//opt = {local: true, clear:true, unsupportCall: function(){}}
	this.webStorage = function(opt,key,value){
		if (!opt) opt = {};
		var storeType = undefined;
		if (opt.local) storeType = window.localStorage;
		else storeType = window.sessionStorage;
		if (!storeType){
			if (opt.unsupportCall) opt.unsupportCall();
			return false;
		}
		if (opt.clear) {
			storeType.clear();
			return false;
		}
		if (!key) return false;
		if (value===undefined){
			return storeType.getItem(key);
		}
		if (value===null){
			storeType.removeItem(key);
			return false;
		}
		storeType.setItem(key,value);
		return false;
	};
	
	// html autocomliate [need ext]
	// autoSearch('#someInput',{addit:'secondAutocompleae'},function(query,input_selector){
	//				if (query === '') return false; // interception request
	//				else return query; // returning query important
	//			}, function(query,response){ alert('success response');})
	// input_selector attrs[m_auto_to='insert result in',]
	this.autoSearch = function(input_selector,param,before_call,after_call){
		var m_auto_interval = false;
		var m_auto_last_query = '';
		$(document).on('keyup', input_selector, function(){
			param['query'] =$(this).val();
			var to_selector = $(this).attr('m_auto_to');
			if (before_call !== undefined) {
				param['query'] = before_call(param['query'],input_selector); // $.extend if [edit] [no_support old versions]
				if (param['query'] === false) return false;
			}
			var url = $(this).attr('m_auto_url');
			if (m_auto_interval) clearTimeout(m_auto_interval);
			m_auto_interval = setTimeout(function() {
				clearTimeout(m_auto_interval);
				m_auto_last_query = param['query'];
				$.post(url, param, function(data) {
					try {
						if (after_call !== undefined) {
							after_call(param['query'],data);
						}
						var obj = $.parseJSON(data);
						if (obj['query'] === m_auto_last_query) {
							$(to_selector).html(obj['response']);
						}
					} catch(ex) {
						alert('search error!');
						alert(data);
					}
					m_auto_interval = false;
				});
			}, 400);
			return true;
		});
		return false;
	};
	// enterclick activate
	this.enterClickDefCallback = function(){
		eval($(this).attr("onclickenter")); return false;
	};
	this.onClickEnterInit = function(selector,opt){
		$(document).on('keypress', selector, function(e) {
			e = e || window.event;
			if (opt && (opt.ctrl === true)){
				if ((e.keyCode===13 || (e.keyCode===10)) && e.ctrlKey){
					if (opt && opt.callback) opt.callback.call(this);
					else mthis.enterClickDefCallback.call(this);
				}
				return true;
			}
			if (e.keyCode===13){
				if (opt && opt.callback) opt.callback.call(this);
				else mthis.enterClickDefCallback.call(this);
			}
			return true;
		});
	};
	//[experemental]
	this.getByteLength = function(str){ 
		return encodeURIComponent(str).replace(/%../g, 'x').length;
	};
	

	
	return this;
})(jQuery);

// V V V ***** DEFFAULT MODULES ***** V V V
// BEGIN SCROLL POPUP MODULE
mjsa = (function ($){
	this.scrollPopup = (function($){
		var defOptions = {
			width: 600,
			top: 100,
			padding_hor: 15,
			modelName: 'mjsa.scrollPopup', // [versionedit]
			mainContainer: '#container',
			loading_image: '/pub/images/loader.gif',
			close_btn_style: undefined,
			close_btn_class: undefined,
			zindex: 19,
			call_open:undefined,
			call_close:undefined
		};
		var m = {};
		m.openedSelectors = []; //[edit] 
		//add support escape button to close opened popups
		// add save all opened popups
		// add functions closing all popups
		m._createPopup = function(options){
			// style
			var str_html = '<style>';
			str_html += '	.popup_scroll_shadow{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; opacity: 0.6; z-index: '+options.zindex+';}';
			str_html += '	.popup_scroll_loading{ display: none; position: fixed; top: 100px; left: 0; width: 100%; height: 100%;  text-align:center; z-index: '+(options.zindex+1)+';}';
			str_html += '	.popup_scroll{ display: none; width: '+(options.width+options.padding_hor)+'px; top: '+options.top+'px; left: 50%; margin-left: -'+((options.width+options.padding_hor)/2)+'px; position: fixed; z-index: '+(options.zindex+1)+'; padding: 0 0 20px; min-height:100px; }';
			str_html += '	.popup_scroll_body{ position: relative;  padding: 13px '+options.padding_hor+'px 15px; line-height: normal; background:#fff; }';
			if (options.close_btn_style !== undefined) {
				str_html += '	.close_popup_scroll{ '+options.close_btn_style+' }';
			}
			str_html += '	.popup_scroll_content{ }';
			str_html += '</style>';
			// shadow
			str_html += '<div class="popup_scroll_shadow toggle_popup_scroll" onclick="return '+options.modelName+'.close(\''+options.selector+'\')"></div>';
			// popup container
			str_html += '<div class="popup_scroll_loading"><img src="'+options.loading_image+'" alt="loading" style="margin: 0 auto;" /></div>';
			str_html += '<div class="popup_scroll toggle_popup_scroll">';
				// popup body
				str_html += '<div class="popup_scroll_body">';
					// popup close botton
					if (options.close_btn_style !== undefined) {
						str_html += '<div href="#" class="close_popup_scroll';
						if (options.close_btn_class) str_html += ' '+options.close_btn_class;
						str_html += '" onclick="return '+options.modelName+'.close(\''+options.selector+'\')"></div>';
					}
					// popup content
					str_html += '<div class="popup_scroll_content"><br/><br/><br/>What?</div>';
				str_html += '</div>';
			str_html += '</div>';
			$(options.selector).html(str_html);
			return false;
		};
		m._showShadow = function(selector){
			var options = $(selector).data('options');
			var nowpos = self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
			var con_width = $(options.mainContainer).css('width');
			var body_width = $('body').css('width');
			var nowpos1 = parseInt(nowpos);
			nowpos1+=50;
			var con_width1 = parseInt(con_width);
			var body_width1 = parseInt(body_width);
			var left_p1 = (body_width1 - con_width1)/2;
			$(options.mainContainer).css('position', 'fixed');
			$(options.mainContainer).css('top', '-'+nowpos+'px');
			$(options.mainContainer).css('left', ''+left_p1+'px');
			$(options.selector+' .popup_scroll_shadow').show();
			options.nowpos = nowpos;
			if (options.call_open !== undefined) {
				options.call_open();
			}
			$(selector).data('options',options);
			return false;
		};
		m._loading = function(selector, visible){
			var options = $(selector).data('options');
			if (visible) {
				$(options.selector+' .popup_scroll_loading').show();
			} else {
				$(options.selector+' .popup_scroll_loading').hide();
			}
			return false;
		};
		m._showPopup = function(selector){
			var options = $(selector).data('options');
			$(options.selector+' .popup_scroll').show();
			$(options.selector+' .popup_scroll').css('overflow', 'visible');
			$(options.selector+' .popup_scroll').css('position', 'absolute');
			$(options.selector+' .popup_scroll').css('top', options.top+'px');
			return false;
		};
		m._createParent = function(selector){
			if (!($(selector).length > 0)) {
				if (selector.indexOf('#') !== -1) {
					$('body').append('<div id="'+selector.substring(selector.indexOf('#')+1)+'"> </div>');
				} else {
					alert('Cant create element: '+ selector);
				}
			}
			return false;
		};
		m.init = function(selector, options){
			this._createParent(selector);
			options.selector = selector;
			var opt = $.extend(defOptions, options);
			$(selector).data('options',opt);
			this._createPopup(opt);
			return false;
		};
		m.open = function(selector, url, content){
			this._showShadow(selector);
			this._loading(selector,true);
			if (content !== undefined) {
				$(selector + ' .popup_scroll_content').html(content);
			}
			var thethis = this;
			if (url !== undefined) {
				$.get(url,{},function(data){
					thethis._loading(selector,false);
					thethis._showPopup(selector);
					mjsa.html(selector + ' .popup_scroll_content',data);
				});
			} else {
				this._loading(selector,false);
				this._showPopup(selector);
			}
			return false;
		};
		m.close = function(selector){
			var options = jQuery(selector).data('options');
			if (!options) return false;
			$(options.selector+' .toggle_popup_scroll').hide();
			$(options.mainContainer).css('position', 'relative');
			$(options.mainContainer).css('top', 'auto');
			$(options.mainContainer).css('left', 'auto');
			$("html,body").scrollTop(options.nowpos);
			if (options.call_close !== undefined) {
				options.call_close();
			}
			$(selector + ' .popup_scroll_content').html('');
			return false;
		};
		m.content = function(selector,content){
			var options = $(selector).data('options');
			return false;
		};
		return m;
	}($));
	return this;
}).call(mjsa,jQuery);
// END SCROLL POPUP



// ***** DEPRECATED ADDON (FOR SUPPORT OLDER APPLICATIONS) *****

mjsa = (function ($){
	var mthis = this;

	if (mthis.def.appMeetVersion < 500) {
		//[deprecated functions]
	}
	
	// [experemental]
	this.hint = new (function(){
		var hself = this;
		this._createCont = function(){
			$('body').append($('<div/>').addClass(mthis.def.hintsContClass));
		};
		this.recall = undefined;
		this.show = function(hint,classn){
			if (hself.recall){recall();return false;}
			if (!mthis.def.hintsContClass) { alert('hint: '+hint); return false;}
			if ($('.'+mthis.def.hintsContClass).length===0) hself._createCont();
			$('.'+mthis.def.hintsContClass).append('<div style="display:none; clear:left;"><div class="'+mthis.def.hintClass+' '+classn+'">'+hint+'</div>');
			$('.'+mthis.def.hintsContClass).find('.hint'+ms_time).animate({height: "show"}, 300);
			
		};
	})();
	
	return this;
}).call(mjsa,jQuery);

// ***** END DEPRECATED ADDON *****


/* 
**************************************************************
Version History

v0.5.0.47
add func: webStorage

v0.5 alpha build 46
add func: geoLocation

v0.5 alpha build 45
remove deprecated funtions
collectParams - add [take=html]
loadCollectedParams [take=html support]
format code
rename = circleTimer
	this._innerCircleTimerHandler => this._circleTimerHandler
	this._innerCircleTimerCallback => this._circleTimerCallback
	this.circleTimerInit => this.circleTimer
add func: debug (debuging param to log)
rename = bodyAjax
	html5AjaxBody => bodyAjax
	html5AjaxBodyUpdate => bodyAjaxUpdate
	def.html5HistoryAjax => def.bodyAjax


v0.4.3.43
easilyPostAjax fixes

v0.4.3.42
html5AjaxBody - pushonly

v0.4.2.41
some fixes
mjs_save selecor mthis.def.haSaveSelector

v0.4.1.40
fix func: _ajax (error status code show)
fix func: bodyajax (if havnt container simple location)
scroll_to(val) -> scrollTo(val)

v0.4.0.39
start creating deprecated addon with deprecated interface
start creating submodels
edit func: location

v0.3.14.38
scrollPopup codeinterface fix

v0.3.13.37
print_hint animation

v0.3.12.36
fix: historyAjax - fix push eq. states

v0.3.11.35
ext mod: scrollPopup (class close btn)

v0.3.10.34
ext func: html (def.htmlInterception)
fix func: html5historyAjax (location.pathname+location.search)

v0.3.9.33
fix: circleTimer
mjs_save in AjaxBody (?)

v0.3.8.32
ext func: html (prepand_sepearator, html_prepand_sepearator)
add func: circleTimerInit (easy stand alone timer)
some easy fixes

v0.3.7.31
add func: loadCollectedParams
ext func: html5AjaxBodyUpdate

v0.3.6.30
add func:html5AjaxBodyUpdate
some easy fixes

v0.3.5.29
some easy fixes

v0.3.5.28
[deprecated] liveEnterClick -> onClickEnterInit(support ctrl+Enter) (support js func)

v0.3.4.27
add func: getByteLength (length bytes in utf8 string)

v0.3.3.26
jQuery 1.9 support
	$.browser removed, scroll_to for html,body
	.live -> .on
liveEnterClick[deprecated] -> liveClickEnterInit

v0.3.3.25
hot fix: history ajax body (Google Chrome fix)

v0.3.2.24
ext: scroll popup (top parameter in options)
edit: History ajax body (noajax no change location.href)
edit: History ajax body (selector as parameter 'a' default)
fix: print_r (add maxlevel for infinity rec)
fix: History ajax body (with location problem, need support mm mjsa command if body_ajax)
ext: History ajax body (html insert selector as parameter)

v0.3.1.23
hot fixes: scroll popup
add ext: html5 History Body Ajax (noajax attr)

v0.3.0.22
~default variables
add func: debug_param
edit func: html support old fersions
mjs_this -> mthis
add func: html5AjaxBody
add func: html5HistoryAjaxInit
hot fix: print_r

v0.2.7.21
~edit:  ._ajax now used in easylyPostAjax 

v0.2.6.20
+add func: grabResponseTag

v0.2.5.19
+re_func: print_error (rewrite)

v0.2.4.18
~setCookie form ajax prepare

v0.2.4.17
+add ext: html (html_replace_separator, html_append_separator)

v0.2.3.16
+add ext: html (error_separator)

v0.2.2.15
+add func: _ajax (thriple ajax ) need test
+add func: s (selectable support)

v0.2.2.14
~edit~ext: autoSearch (before_call, return query edit query,)

v0.2.2.12
~fix: scrollPopup (not jumping at top page after closing popap)
~fix: scrollPopup (clear popup after closing)

v0.2.1.10
+add option: autoSearch (before_call, after_call)

v0.2.0.9
~re-architect: init module with NEW, THIS contexts

v0.1.6.8
~reoption: scrollPopup (close_image -> close_btn)

v0.1.5.7
+add option: scrollPopup (add(close_image=undefined),add(zindex),call_open,call_close)

v0.1.4.6
+submodel: scrollPopup

v0.1.3.5
~fix: collectParams (return {} if undefined selector, waitmessage internal)

v0.1.2.4
+add func: autoSearch(need test, need ext)
+add func: liveEnterClick

v0.1.1.3
+add ext: html(+append_separator)
+add func: browserContainer(for scrolls)
+add func: scroll_to(value)
+add func: collectParams(return params object by selector)
+add func: easilyPostAjax(url, insert_selector, post_obj, post_selector, add_callback, add_precall) 

v0.1.1.2
+add func: print_r
+add ext: location(+hash)
+add ext: html(+alert_separator)

v0.1.0.1
+add func: html (+redirect separator) (test)
+add func: location (+a_separator)(test)

/////////////////////////////////////////////////////
//// FUTURE /////////////////////////////////////////
/////////////////////////////////////////////////////
1) ajax upload
http://learn.javascript.ru/xhr-onprogress
http://habrahabr.ru/post/154097/
http://xdan.ru/Working-with-files-in-JavaScript-Part-1-The-Basics.html
http://html5demos.com/file-api



First tasks 

-errors with scrollpopup open url , 500 example

-print_hint .delay - use (page255) (release up)
-set submodules html5history and etc with creating deprecated addon (minor version up)





*/