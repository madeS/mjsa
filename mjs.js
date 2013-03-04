/*
	Mades JavaSctips Alpha-snappets
	author: Andrei Bogarevich
	site: https://github.com/madeS/mjsa
	v0.3.5.28
	Last Mod: 2013-03-02 10:45
*/
var mjsa = new (function ($){
	var mjs_this = this; // [deprecated] - support old application
	var mthis = this; 
	// Defaults variables
	this.wait_message = undefined; // in easilyAjax - not recommended
	this.def = {
		testing: true,
		appMeetVersion: 200, //300, // set 200 for old application
		html5HistoryAjax: false,  //true, // set false for old application, and for not support body ajax server side
		html5HistoryAjax_inselector: '#body_cont',  //body, 
		html5HistoryAjaxOnloadFunc: undefined,  // reAttach events for dom and etc. 
		hintsContClass: 'undefined', //'mjs_hints_container', undefined for alerts warnings, else need connect mjsa css
		hintClass: 'mjs_hint',
		hintSuccess: 'mjs_hint_success',
		hintError: 'mjs_hint_error',
		hintSimple: 'mjs_hint_simple',
		hintLiveMs: 10000
	}
	
	//  *** error message ***
	this.print_error = function(error_msg){
		return mthis.print_hint(error_msg,mthis.def.hintError);
	}
	this._createHintsContainer = function(){ 
		$('body').append('<div class="'+mthis.def.hintsContClass+'"></div>');
	}
	this.print_hint = function(hint,className){ 
		if (!mthis.def.hintsContClass) { alert('hint: '+hint); return false;}
		if (!className)  className = mthis.def.hintSimple;
		var ms = new Date(); var ms_time = ms.getTime();
		if ($('.'+mthis.def.hintsContClass).length == 0) mthis._createHintsContainer();
		
		$('.'+mthis.def.hintsContClass).append('<div class="'+mthis.def.hintClass+' '+className+' hint'+ms_time+'">'+hint+'</div>');
		window.setTimeout("jQuery('."+mthis.def.hintsContClass+" ."+mthis.def.hintClass+"."+className+".hint"+ms_time+"').remove()", mthis.def.hintLiveMs);
		return false;
	}
	
	this.print_r = function(arr, level, maxlevel){
		if (!maxlevel) maxlevel = 10;
		if (level >= maxlevel) return '';
		var print_red_text = "";
		if (!level) level = 0;
		var level_padding = "";
		for(var j=0; j<level+1; j++) level_padding += "    ";
		if(typeof(arr) == 'object') {
			for(var item in arr) {
				var value = arr[item];
				if(typeof(value) == 'object') {
					print_red_text += level_padding + "'" + item + "' :\n";
					print_red_text += mthis.print_r(value,level+1,maxlevel);
				} else print_red_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		} else  print_red_text = "===>"+arr+"<===("+typeof(arr)+")";
		return print_red_text;
	}
	this.debug_param = function(e){alert(this.print_r(e))}

	// *** selectable support ***
	this.jSelected = undefined;
	this.s = function(selector){jSelected = $(selector); return this;}
	
	// *** inner 3X Ajax ***
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
					if (options.error !== undefined ) options.error();
					else mthis.print_error('Network connection problem (code 0001)',jqXHR, textStatus, errorThrown) // [edit] // 500 code error
				}
			}
		});
		$.ajax(innerOptions);
	}
	
	// scroll to value in pixels
	this.scroll_to = function(value){
		var item =  $("html,body");
		if(typeof(value)=="number")  {
			item.animate({scrollTop: value});
		} else {
			var sct = jQuery(value).offset().top;
			item.animate({scrollTop: sct});
		} 
		return false;
	}
	
	// *** easily ajax ***
	// collects params
	this.collectParams = function(selector){
		if (selector === undefined) return {};
		var ret = {};
		jQuery(selector).each(function(indx, element){
			if (jQuery(this).val() && jQuery(this).attr('name')) {
				if (jQuery(this).is('input[type=checkbox]')){
					ret[jQuery(this).attr('name')] = (jQuery(this).is(':checked'))?'1':'0';
				} else if (jQuery(this).is('input[type=radio]')) {
					if (jQuery(this).is(':checked')) {
						ret[jQuery(this).attr('name')] = jQuery(this).val();
					} else {
						if (ret[jQuery(this).attr('name')] === undefined) {
							ret[jQuery(this).attr('name')] = '';
						}
					}
				} else {
					ret[jQuery(this).attr('name')] = jQuery(this).val();
				}
			}
		}); return ret;
	}
	// easilyPostAjax
	this.easilyPostAjax = function(url, insert_selector, post_obj, post_selector, add_callback, add_precall){
		var data = $.extend(post_obj,this.collectParams(post_selector));
		if (add_precall != undefined) { 
			if (add_precall(data)) return false;
		}
		if (this.wait_message !== undefined) {
			if (insert_selector !== undefined) {
				$(insert_selector).html(this.wait_message);
			}
		}
		mthis._ajax({
			url: url,
			type: 'POST',
			data: data,
			success:function(data) {
				if (insert_selector !== undefined) {
					//jQuery(insert_selector).html(data);
					mthis.html(insert_selector,data);
				}
				if (add_callback != undefined) { 
					add_callback(data);
				}
			}
		});
		return false;
	}
	// *** "HTML5 History" Body Ajax [BETA] ***
	this._get_ajaxShadow = function(){
		if($('.mjs_ajax_shadow').length === 0) $('body').append('<div class="mjs_ajax_shadow"></div>');
		return $('.mjs_ajax_shadow');
	}
	this.html5AjaxBody = function(link,opt){
		if (!opt) opt = {};
		var noajax = false; if (opt && opt.el) noajax = $(opt.el).attr('noajax');
		if ((link.indexOf('http') === 0) || !(window.history && history.pushState) || (noajax)) {
			if (mthis.def.testing) alert('not support html5, or link started from http, or NOAJAX: '+link);
			document.location.href = link; return false;
		}
		mthis._get_ajaxShadow().animate({opacity: "show"},200);
		mthis._ajax({
			url: link, type: 'GET', data: {body_ajax: 'true'},
			success:function(content){ 
				var content_separated = undefined;
				if (content.indexOf('<ajaxbody_separator/>') !== -1) {
					content_separated = content.split('<ajaxbody_separator/>');
					if ((content_separated.length > 1)) { //  && (content.indexOf('<redirect_separator/>') === -1) [edit] something wrong with redirect
						if(!opt.nopush){
							mthis.currentPathname = link;
							history.pushState({url:link,title:content_separated[0]}, content_separated[0], link);
						}
						mthis.html(mthis.def.html5HistoryAjax_inselector,content_separated[1]);
						if (mthis.def.html5HistoryAjaxOnloadFunc){
							mthis.def.html5HistoryAjaxOnloadFunc();
						}
					}
				} else {
					mthis.html('body',content);
				}
				mthis._get_ajaxShadow().queue(function(){ $(this).animate({opacity: "hide"},200); $(this).dequeue();});
			},
			error:function(){
				mthis._get_ajaxShadow().queue(function(){ $(this).animate({opacity: "hide"},200); $(this).dequeue();});
			}
		});
	}
	this.currentPathname = '';
	this.html5HistoryAjaxInit = function(selector){
		if (!selector) selector = 'a';
		if(!mthis.def.html5HistoryAjax) {
			mthis.print_error('"Html 5 History Ajax" disabled in MJS settings');
			return false;
		}
		$(document).on('click', selector, function(){
			if (($(this).attr('href') !== '#'))
				mthis.html5AjaxBody($(this).attr('href'),{el:this});
			return false;
		});
		mthis.currentPathname = location.pathname;
		if ((window.history && history.pushState)){
			window.addEventListener("popstate", function(e) {
				//alert(location.pathname +' - '+mthis.currentPathname);
				if (location.pathname != mthis.currentPathname){
					//alert(2);
					mthis.html5AjaxBody(location.pathname,{nopush:true});//(e.url); not working :(
				}
				e.preventDefault();
			}, false)
		}
		return false;
	}

	// [edit] - insert geoLocation by GPS
	
	// in test type=[undefined, a_selector, hash]
	this.location = function(link,type){
		if (type !== undefined) {
			if (type === 'a_selector') {
				var addressString = document.location.href;
				link = $(link).attr('href');
				if (mthis.def.html5HistoryAjax) {
					mthis.html5AjaxBody(link);
				}else document.location.href = link;
			}
			if (type === 'hash') { //[deprecated]
				var addressString = document.location.href;
				if (addressString.indexOf("#",0) >= 0 ) {
					var reg = new RegExp("(#[^#]*)", "i")
					addressString = addressString.replace(reg, link);
				} else {
					addressString += link;
				}
				document.location.href = addressString;
				return false;
			}
		} else {
			if (mthis.def.html5HistoryAjax) {
				mthis.html5AjaxBody(link);
			} else {
				document.location.href = link;
			}
		}
		return false;
	}
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
		if (content.indexOf('<stop_separator/>') !== -1) needHtml = false;
		if (needHtml) {
			jSel.html(content);
		}
		return jSel;
	}
	this.grabResponseTag = function(response,tag){
		if (response.indexOf(tag) !== -1) {
			content_separated = response.split(tag);
			if (content_separated.length > 1) {
				return content_separated[1];
			}
		}
		return false;
	}
	// html autocomliate (need test, need ext)
	// input_selector attrs[m_auto_to='insert result in',]
	this.autoSearch = function(input_selector,param,before_call,after_call){
		var m_auto_interval = false;
		var m_auto_last_query = '';
		$(document).on('keyup', input_selector, function(){
			param['query'] =jQuery(this).val();
			var to_selector = jQuery(this).attr('m_auto_to');
			if (before_call !== undefined) {
				param['query'] = before_call(param['query'],input_selector); // $.extend if [edit] [no_support old versions]
				if (param['query'] === false) return false;
			}
			var url = jQuery(this).attr('m_auto_url');
			if (m_auto_interval) clearTimeout(m_auto_interval);
			m_auto_interval = setTimeout(function() {
				clearTimeout(m_auto_interval);
				m_auto_last_query = param['query'];
				jQuery.post(url, param, function(data) {
					try {
						if (after_call !== undefined) {
							after_call(param['query'],data);
						}
						var obj = jQuery.parseJSON(data);
						if (obj['query'] == m_auto_last_query) {
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
	}
	// enterclick activate
	this.enterClickDefCallback = function(el){
		eval($(el).attr("onclickenter")); return false;
	}
	this.onClickEnterInit = function(selector,opt){
		$(document).on('keypress', selector, function(e) {
			e = e || window.event;
			if (opt && (opt.ctrl === true)){
				if ((e.keyCode==13 || (e.keyCode==10)) && e.ctrlKey){
					if (opt && opt.callback) opt.callback(this);
					else mthis.enterClickDefCallback(this);
				}
				return true;
			}
			if (e.keyCode==13){
				if (opt && opt.callback) opt.callback(this);
				else mthis.enterClickDefCallback(this);
			}
			return true;
		});
	}
	//[deprecated]
	this.liveEnterClick = function(selector){
		$(selector).live('keypress', function(e) {
			if(e.keyCode==13) {
				eval($(this).attr("enterclick"));
			}
		});
	}
	this.getByteLength = function(str){ // experemental
		return encodeURIComponent(str).replace(/%../g, 'x').length;
	}
	return this;
})(jQuery);

// V V V ***** DEFFAULT MODULES ***** V V V
// BEGIN SCROLL POPUP
mjsa = (function ($){
	this.scrollPopup = (function($){
		var defOptions = {
			width: 600,
			top: 100,
			modelName: 'mjsa.scrollPopup', // [versionedit]
			mainContainer: '#container',
			loading_image: '/views/i/loadermap.gif',
			close_btn_style: undefined,
			zindex: 19,
			call_open:undefined,
			call_close:undefined
		}
		var m = {};
		m._createPopup = function(options){
			// style
			var str_html = '<style>';
			str_html += '	.popup_scroll_shadow{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; opacity: 0.6; z-index: '+options['zindex']+';}';
			str_html += '	.popup_scroll_loading{ display: none; position: fixed; top: 100px; left: 0; width: 100%; height: 100%;  text-align:center; z-index: '+(options['zindex']+1)+';}';
			str_html += '	.popup_scroll{ display: none; width: '+options['width']+'px; top: '+options.top+'px; left: 50%; margin-left: -'+(options['width']/2)+'px; position: fixed; z-index: '+(options['zindex']+1)+'; padding: 0 0 20px; min-height:100px; }';
			str_html += '	.popup_scroll_body{ position: relative;  padding: 13px 28px 15px; line-height: normal; background:#fff; }';
			if (options['close_btn_style'] !== undefined) {
				str_html += '	.close_popup_scroll{ '+options['close_btn_style']+' }';
			}
			str_html += '	.popup_scroll_content{ }';
			str_html += '</style>';
			// shadow
			str_html += '<div class="popup_scroll_shadow toggle_popup_scroll" onclick="return '+options['modelName']+'.close(\''+options['selector']+'\')"></div>';
			// popup container
			str_html += '<div class="popup_scroll_loading"><img src="'+options['loading_image']+'" alt="loading" style="margin: 0 auto;" /></div>';
			str_html += '<div class="popup_scroll toggle_popup_scroll">';
				// popup body
				str_html += '<div class="popup_scroll_body">';
					// popup close botton
					if (options['close_btn_style'] !== undefined) {
						str_html += '<div href="#" class="close_popup_scroll" onclick="return '+options['modelName']+'.close(\''+options['selector']+'\')"></div>';
					}
					// popup content
					str_html += '<div class="popup_scroll_content"><br/><br/><br/>What?</div>';
				str_html += '</div>';
			str_html += '</div>';
			$(options['selector']).html(str_html);		
			return false;
		}
		m._showShadow = function(selector){
			var options = $(selector).data('options');
			var nowpos = self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
			var con_width = $('#container').css('width');
			var body_width = $('body').css('width');
			var nowpos1 = parseInt(nowpos);
			nowpos1+=50;
			var con_width1 = parseInt(con_width);
			var body_width1 = parseInt(body_width);
			var left_p1 = (body_width1 - con_width1)/2;
			$(options['mainContainer']).css('position', 'fixed');
			$(options['mainContainer']).css('top', '-'+nowpos+'px');
			$(options['mainContainer']).css('left', left_p1 + 'px');
			$(options['selector']+' .popup_scroll_shadow').show();
			options['nowpos'] = nowpos;
			if (options['call_open'] !== undefined) {
				options['call_open']();
			}
			$(selector).data('options',options);
			return false;
		}
		m._loading = function(selector, visible){
			var options = $(selector).data('options');
			if (visible) {
				$(options['selector']+' .popup_scroll_loading').show();
			} else {
				$(options['selector']+' .popup_scroll_loading').hide();
			}
			return false;
		}
		m._showPopup = function(selector){
			var options = $(selector).data('options');
			$(options['selector']+' .popup_scroll').show();
			$(options['selector']+' .popup_scroll').css('overflow', 'visible');
			$(options['selector']+' .popup_scroll').css('position', 'absolute');
			$(options['selector']+' .popup_scroll').css('top', options.top+'px');
			return false;
		}
		m._createParent = function(selector){
			if (!($(selector).length > 0)) {
				if (selector.indexOf('#') !== -1) {
					$('body').append('<div id="'+selector.substring(selector.indexOf('#')+1)+'"> </div>')
				} else {
					alert('Невозможно создать элемент: '+ selector);
				}
			}
			return false;
		}
		m.init = function(selector, options){
			this._createParent(selector);
			options['selector'] = selector;
			var opt = $.extend(defOptions, options);
			$(selector).data('options',opt);
			this._createPopup(opt);
			return false;
		}
		m.open = function(selector, url, content){
			this._showShadow(selector);
			this._loading(selector,true);
			if (content !== undefined) {
				$(selector + ' .popup_scroll_content').html(content)
			}
			var thethis = this;
			if (url !== undefined) {
				$.get(url,{},function(data){
					thethis._loading(selector,false);
					thethis._showPopup(selector);
					mjsa.html(selector + ' .popup_scroll_content',data)
				});
			} else {
				this._loading(selector,false);
				this._showPopup(selector);
			}
			return false;
		}
		m.close = function(selector){
			var options = jQuery(selector).data('options');
			$(options['selector']+' .toggle_popup_scroll').hide();
			$(options['mainContainer']).css('position', 'relative');
			$(options['mainContainer']).css('top', 'auto');
			$(options['mainContainer']).css('left', 'auto');
			$("html,body").scrollTop(options['nowpos']);
			if (options['call_close'] !== undefined) {
				options['call_close']();
			}
			$(selector + ' .popup_scroll_content').html('');
			return false;
		}
		m.content = function(selector,content){
			var options = $(selector).data('options');
			return false;
		}
		return m;
	}($));
	return this;
}).call(mjsa,jQuery);
// END SCROLL POPUP

/*
**************************************************************
Version History

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
2) geoLocation



*/


