/*
	Mades JavaSctips Alpha-snippets
	Author: Andrei Bogarevich
	License:  MIT License
	Site: https://github.com/madeS/mjsa
	v1.1.4.107
	Last Mod: 2016-01-29 20:00
*/
var mjsa = new (function ($){
	var mthis = this; 
	// Defaults variables
	this.def = {
		testing: false,
		service: '#m_service', // class for executing server JS
		bodyAjax: false, 
		bodyAjax_inselector: '#body_cont',  //body, 
		bodyAjax_timeout: 5000,
		bodyAjaxOnloadFunc: undefined,  // reAttach events for dom and etc.
		bodyAjaxOnunloadFunc: undefined,  // reAttach events for destroy some objects for this page.
		loadingBlock: undefined, // '<img src="/pub/images/15.gif" alt="" />',
		easilyDefObj: undefined, // obj or func (used for auth in iframe application)
		haSaveSelector: '.mjsa_save', // history ajax save forms inputs selector
		registerErrorsUrl: undefined,//'/mop/mopapi/server_error_register',
		mform: {
			selector: '.m_form', // mForm Selector
			scrollToIncorrectAttr: 'data-scrolltoincorrect', // 
			disableClass: 'disable', // mForm disable class when btn pressed
			inSelector: '.in', // mForm inner selector for collect params
			errorSelector: '.in_error', // mForm error selector to set error text
			incorrectClass: 'm_incorrect', // mForm rror class for error input
			service: '#m_service', // mForm class for executing server JS = def.service
			errorSeparator:'<error_separator/>',
			incorrectSeparator:'<incorrect_separator/>'
		},
		hints: {
			containerClass: 'mjsa_hints_container', //'mjsa_hints_container', undefined for alerts warnings, else need connect mjsa css
			callback: undefined, // application alerts or other action
			mainClass: 'mjsa_hint',
			successClass: 'mjsa_hint_success',
			errorClass: 'mjsa_hint_error',
			simpleClass: 'mjsa_hint_simple',
			closeClass: 'ficon-cancel',
			hintLiveMs: 10000
		},
		htmlInterception: undefined
	};
	
	this.copy = function(obj){ return JSON.parse(JSON.stringify(obj)); };
	this.get = function(obj){
		var ret = obj;
		if(typeof obj === 'function') ret = obj();
		return ret;
	};
	//  *** error message ***
	this.printError = function(error_msg){
		return mthis.printHint(error_msg,mthis.def.hints.errorClass);
	};
	this._getHintsContainer = function(){ 
		var ret = $('.'+mthis.def.hints.containerClass);
		if (ret.length===0) {
			$('body').append('<div class="'+mthis.def.hints.containerClass+'"></div>');
			ret = $('.'+mthis.def.hints.containerClass);
		}
		return ret;
	};
	this.printHint = function(hint,className,opt){
		opt = opt || {};
		if (mthis.def.hints.callback && !mthis.def.hints.callback(hint,className)){
			// do nothing
		} else if (mthis.def.hints.containerClass){
			if (!className) className = mthis.def.hints.simpleClass;
			var ms = new Date(); var ms_time = ms.getTime();
			var $hintCont = mthis._getHintsContainer();
			$hintCont.append(
					'<div class="hintwrap hint'+ms_time+'"><div class="'+mthis.def.hints.mainClass+' '+className+'">'+hint+'<span class="close '+mthis.def.hints.closeClass+'" onclick="$(this).parents(\'.hintwrap\').remove();" ></span></div></div>');
			$hintCont.find('.hint'+ms_time).animate({height: "show"}, 300);
			if (!opt.permanent){
				window.setTimeout(function(){
					$('.'+mthis.def.hints.containerClass).find('.hint'+ms_time+'')
						.animate({height: "hide"},{duration:300,done:function(){$(this).remove();}});
				}, opt.live || mthis.def.hints.hintLiveMs);
			}
		}
		return false;
	};
	
	this.print_r = function(arr, level, maxlevel){
		if (!maxlevel) maxlevel = 3;
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
	this.debugParam = function(e){alert(this.print_r(e));};
	this.debug = function(e){console.log('debugging:',e);};

	// *** intervalStack module - easy stand alone interval timer
	this._intervalStackHandlers = [];
	this.intervalStackAdd = function(func,timer){
		return mthis._intervalStackHandlers.push(setInterval(func,timer)) - 1;
	};
	this.intervalStackClear = function(index){
		var count = 1;
		if (!index){
			index = 0; count = mthis._intervalStackHandlers.length;
		}
		var arr = mthis._intervalStackHandlers.splice(index,count);
		for(var i in arr) clearInterval(arr[i]);
		return false;
	};

	// *** inner x3 Ajax ***
	this._ajax_recurs = 3;
	this._defAjaxError = function(jqXHR, textStatus, errorThrown){
		if (jqXHR.status === 0 && jqXHR.statusText === 'error') jqXHR.statusText = 'Connection error';
		mthis.printError('Error '+jqXHR.status+': '+jqXHR.statusText);
		if (mthis.def.registerErrorsUrl) $.post(mthis.def.registerErrorsUrl,{
			status: jqXHR.status, statusText: jqXHR.statusText, response: jqXHR.responseText
		});
	};
	this._ajax = function(options){
		var innerOptions = $.extend(mthis.copy(options),{
			success: function(html, textStatus, XMLHttpRequest){
				mthis._ajax_recurs = 3;
				if (options.success !== undefined) options.success(html, textStatus, XMLHttpRequest);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (mthis._ajax_recurs > 0) {
					mthis._ajax_recurs--;
					options.timeout = undefined;
					mthis._ajax(options);
				} else {
					mthis._ajax_recurs = 3;
					if (options.error !== undefined ) options.error(jqXHR, textStatus, errorThrown);
					else { mthis._defAjaxError(jqXHR, textStatus, errorThrown); }
				}
			}
		});
		$.ajax(innerOptions);
	};
	
	// scroll to value in pixels or to selector
	this.scrollTo = function(value,opt){
		opt = opt || {};
		if(opt.timer === undefined )opt.timer = 500;
		var item =  $("html,body");
		if (value === undefined){
			return $(window).scrollTop();
		}
		if(typeof(value)==="number")  {
			item.animate({scrollTop: value},opt.timer);
		} else {
			if (!$(value).length) return false;
			var sct = $(value).offset().top;
			if (opt.offset) sct += opt.offset;
			item.animate({scrollTop: sct},opt.timer);
		}
		return false;
	};
	
	this.isInWindow = function(el){
		var scrollTop = $(window).scrollTop();
		var windowHeight = $(window).height();
		var $el = $(el);
		var offset = el.offset();
		if(offset && scrollTop <= offset.top && (el.height() + offset.top) < (scrollTop + windowHeight)){
			return true;
		}
		return false;
	};
	
	this.urlParams = function(params,url){
		if (params===undefined){
			if (!location.search) return {};
			var data = {};
			var pairs = location.search.substr(1).split('&');
			for(var i = 0; i < pairs.length; i++){
				var param = pairs[i].split('=');
				data[param[0]] = decodeURIComponent(param[1]);
			}
			return data;
		} else {
			url = url || '';
			var paramStr = [];
			for(var key in params){
				if (params[key] !== ''){
					paramStr.push(key+'='+encodeURIComponent(params[key]));
				}
			}
			return url+((url && paramStr)?'?':'')+paramStr.join('&');
		}
	};
	
	// for js
	this.getPosition = function(e){
		var left = 0, top = 0;
		while (e.offsetParent){
			left += e.offsetLeft;
			top  += e.offsetTop;
			e = e.offsetParent;
		}
		left += e.offsetLeft;
		top  += e.offsetTop;
		return {x:left, y:top};
	};
	
	// *** easily ajax ***
	// collects params
	this.collectParams = function(selector){
		if (selector === undefined) return {};
		var ret = {};
		$(selector).each(function(indx, element){
			var name = $(this).attr('name') || $(this).attr('data-name');
			if (name) {
				if ($(this).is('input[type=checkbox]')){
					if ($(this).attr('data-value')){
						if($(this).is(':checked')) ret[name] = ((ret[name])?ret[name]+';':'')+$(this).attr('data-value');
					} else ret[name] = ($(this).is(':checked'))?'1':'0';
				} else if ($(this).is('input[type=radio]')) {
					if ($(this).is(':checked')) {
						ret[name] = $(this).val();
					} else {
						if (ret[name] === undefined) {
							ret[name] = '';
						}
					}
				} else if ($(this).is('.take_html, [data-take=html]')) {
					ret[name] = $(this).html();
				} else if ($(this).hasClass('ckeditor')){
					try {
						ret[name] = CKEDITOR.instances[$(this).attr('id')].getData();
					} catch (ex) {console.log('CKEDITOR error - cant get data');}
				} else if ($(this).hasClass('tinymce')){
					try {
						ret[name] = tinyMCE.editors[$(this).attr('id')].getContent();
					} catch (ex) {console.log('TinyMCE error - cant get data');}	
				} else {
					ret[name] = $(this).val();
				}
			}
		}); return ret;
	};
	this.loadCollectedParams = function(selector,collected){
		var el;
		for(var key in collected){
			el = $(selector+'[name='+key+'],'+selector+'[data-name='+key+']');
			if ((el.attr('type') === 'text') || el.is('textarea')) el.val(collected[key]);
			if (el.is('.take_html, [data-take=html]')) el.html(collected[key]);
			if (el.attr('type') === 'radio') el.filter('[value="'+collected[key]+'"]').prop('checked',true);
			if (el.attr('type') === 'checkbox') {
				el.prop('checked',false);
				if ((''+collected[key]).indexOf(';')=== -1){
					 parseInt(collected[key]) && el.prop('checked',true);
				}else{
					var vals = (''+collected[key]).split(';');
					for(var ckey in vals){
						el.filter('[data-value="'+vals[ckey]+'"]').prop('checked',true);
					}
				}
			}
			if (el.is('select')) el.find('[value="'+collected[key]+'"]').prop('selected',true);
		}
	};
	// easilyPostAjax
	this.easilyPostAjax = function(url, insert_selector, post_obj, post_selector, callback, callBefore, opt){
		opt = opt || {};
		opt.disableClass = mthis.def.mform.disableClass;
		post_obj = mthis.get(post_obj) || {};
		if (mthis.def.easilyDefObj) {
			var ext = mthis.get(mthis.def.easilyDefObj);
			post_obj = $.extend(ext, post_obj);
		}
		var data = $.extend(post_obj,mthis.collectParams(post_selector));
		if (callBefore && !callBefore(data)) return false; 
		if (opt.el){
			if ($(opt.el).hasClass(opt.disableClass)) return false; else $(opt.el).addClass(opt.disableClass);
		}
		mthis._ajax({
			url: url, type: opt.ajaxtype || 'POST', data: data,
			success:function(resp) {
				if (insert_selector !== undefined && (opt.isDoHtml===undefined || mthis.get(opt.isDoHtml))){
					if (mthis.get(opt.simpleHtml)){
						$(insert_selector).html(resp);
					} else {
						mthis.html(insert_selector,resp);
					}
				}
				if (opt.el) $(opt.el).removeClass(opt.disableClass);
				callback && callback(resp,data);
			},
			error: function(jqXHR, textStatus, errorThrown){
				if (opt.el) $(opt.el).removeClass(opt.disableClass);
				if (opt.error) opt.error(jqXHR, textStatus, errorThrown);
				else mthis._defAjaxError(jqXHR, textStatus, errorThrown);
			}
		});
		return false;
	};
	
	this.mFormSubmit = function(el,link,options){
		var opt = $.extend(mthis.copy(mthis.def.mform), options || {});
		if ($(el).hasClass(opt.disableClass)) return false; else $(el).addClass(opt.disableClass);
		$(el).parents(opt.selector).find(opt.errorSelector).html('');
		var paramSelector = $(el).parents(opt.selector).find('.'+opt.incorrectClass).removeClass(opt.incorrectClass).end().find(opt.inSelector);
		mthis.easilyPostAjax(link, opt.service, opt.param || {}, paramSelector,
			function(response,data){
				$(el).removeClass(opt.disableClass);
				if (opt.callback && !opt.callback(response,data,el)) return false;
				var incorrect = mthis.grabResponseTag(response,opt.incorrectSeparator);
				if (incorrect){
					var $input = $(el).parents(opt.selector).find('[name='+incorrect+']').addClass(opt.incorrectClass);
					if ($(el).parents(opt.selector).attr(opt.scrollToIncorrectAttr)){
						mthis.scrollTo($input);
					}
				}
				var error_msg = mthis.grabResponseTag(response,opt.errorSeparator);
				if (error_msg){
					$(el).parents(opt.selector).find(opt.errorSelector).html(error_msg);
				}
				return false;
			}, undefined,$.extend({
				error: function(jqXHR, textStatus, errorThrown){
					$(el).removeClass(opt.disableClass);
					mthis._defAjaxError(jqXHR, textStatus, errorThrown);
				}},opt.easyOpt || {})
			);
		return false;		
	};
	// *** "HTML5 History" Body Ajax [BETA] ***
	this._getAjaxShadow = function(){
		var inner = '';
		if(mthis.def.loadingBlock) inner += ''+mthis.def.loadingBlock+'';
		if($('.mjsa_ajax_shadow').length === 0) $('body').append('<div class="mjsa_ajax_shadow" onclick="$(this).hide();"><div class="inner"></div>'+inner+'</div>'); // [TODO: remove inner, use rgba]
		return $('.mjsa_ajax_shadow');
	};
	this._bodyAjaxLastLink = '';
	this.bodyAjax = function(link,opt){
		opt = opt || {};
		if (opt.callBefore && !opt.callBefore(link,opt)) return false;
		var noajax = false; if (opt && opt.el) noajax = $(opt.el).attr('noajax');
		if ((link.indexOf('http') === 0) || !(window.history && history.pushState) || (noajax) || !$(mthis.def.bodyAjax_inselector).length) {
			if (mthis.def.testing) {
				console.log('bodyAjax skiped(link: ',link,', history:',window.history,', noajax',noajax, 'in_selector',$(mthis.def.bodyAjax_inselector).length);
			}
			if (document.location.href === link) {document.location.reload(); return false;}
			document.location.href = link; return false;
		}
		if (opt.pushonly) {
			if (!mthis.currentPathname === link){
				history.replaceState({url:mthis.currentPathname,title:$('title').html(),scroll:mthis.scrollTo()}, $('title').html(), mthis.currentPathname);
				history.pushState({url:link,title:$('title').html(),scroll:0}, $('title').html(), link);
				mthis.currentPathname = link;
			}
			return false;
		}
		mthis._getAjaxShadow().animate({opacity: "show"},150);
		mthis._bodyAjaxLastLink = link;
		mthis._ajax({
			url: link, type: 'GET', data: {body_ajax: 'true'}, timeout:mthis.def.bodyAjax_timeout,
			success:function(content){ 
				var collected = mthis.collectParams(mthis.def.haSaveSelector);
				var content_separated = undefined;
				if (mthis._bodyAjaxLastLink !== link) return false;
				if (content.indexOf('<ajaxbody_separator/>') !== -1) {
					content_separated = content.split('<ajaxbody_separator/>');
					if ((content_separated.length > 1)) { //  && (content.indexOf('<redirect_separator/>') === -1) [edit] something wrong with redirect 
														// [hint] redirect released on server side
						if (mthis.currentPathname === link) opt.nopush = true;
						if(!opt.nopush){
							history.replaceState({url:mthis.currentPathname,title:$('title').html(),scroll:mthis.scrollTo()}, $('title').html(), mthis.currentPathname);
							history.pushState({url:link,title:content_separated[0],scroll:0}, content_separated[0], link);
							if (!opt.noscroll) mthis.scrollTo(0);
						}
						document.title = content_separated[0];
						mthis.currentPathname = link;
						if (mthis.def.bodyAjaxOnunloadFunc){
							mthis.def.bodyAjaxOnunloadFunc();
						}
						mthis.html(mthis.def.bodyAjax_inselector,content_separated[1]);
						mthis.loadCollectedParams(mthis.def.haSaveSelector,collected);
						if (opt.scrollto !== undefined){
							mthis.scrollTo(opt.scrollto,{timer:0});
						}
						if (mthis.def.bodyAjaxOnloadFunc){
							mthis.def.bodyAjaxOnloadFunc();
						}
						if (opt.callback) opt.callback();
					}
				}else if (content.indexOf('<mjsa_separator/>') === 0){
					mjsa.html(mthis.def.service,content);
				} else {
					location.href = link;
				}
				mthis._getAjaxShadow().queue(function(){$(this).animate({opacity: "hide"},150);$(this).dequeue();});
			},
			error:function(jqXHR, textStatus, errorThrown){
				mthis._getAjaxShadow().queue(function(){$(this).animate({opacity: "hide"},150);$(this).dequeue();});
				mthis._defAjaxError(jqXHR, textStatus, errorThrown);
			}
		});
	};
	this.bodyAjaxUpdate = function(){
		mthis.bodyAjax(location.pathname+location.search,{nopush:true,callback:function(){}});
	};
	this.currentPathname = '';
	this.bodyAjaxInit = function(selector){
		if (!selector) selector = 'a';
		mthis.def.bodyAjax = true; // set on bodyAjax in location
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
					mthis.bodyAjax(location.pathname+location.search,{nopush:true,scrollto:e.state.scroll});//(e.url); not working :(
				}
				e.preventDefault();
			}, false);
		}
		return false;
	};

	// changing url brawser string, support bodyAjax
	this.location = function(link){
		if (mthis.def.bodyAjax) {
			mthis.bodyAjax(link);
		} else {
			document.location.href = link;
		}
		return false;
	};
	// insert html with state look [redirect,alert,stop,html replace append prepand, errors and success hints]
	this.html = function(selector,content){
		var jSel = $(selector), 
			i,
			needHtml = true,
			content_separated = undefined,
			par = undefined;
		if (mthis.def.htmlInterception){
			if (!mthis.def.htmlInterception(content)) return jSel; // interception (like <redirect_separator/>/auth)
		}
		if (content.substring(0,'<mjsa_separator/>'.length) !== '<mjsa_separator/>') { // quick end
			jSel.html(content);
			return jSel;
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
				mthis.printError(content_separated[1]);
			}
		}
		if (content.indexOf('<success_separator/>') !== -1) {
			content_separated = content.split('<success_separator/>');
			if (content_separated.length > 1) {
				mthis.printHint(content_separated[1],mthis.def.hints.successClass);
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
			for(i = 1; i < content_separated.length; i++) {
				if (i%2){ 
					par = content_separated[i].split('<html_replace_to/>');
					if (par.length > 1) $(par[0]).html(par[1]);
				}
			}
		}
		if (content.indexOf('<html_append_separator/>') !== -1) {
			content_separated = content.split('<html_append_separator/>');
			for(i = 1; i < content_separated.length; i++) {
				if (i%2){ 
					par = content_separated[i].split('<html_append_to/>');
					if (par.length > 1) $(par[0]).append(par[1]);
				}
			}
		}
		if (content.indexOf('<html_prepend_separator/>') !== -1) {
			content_separated = content.split('<html_prepend_separator/>');
			for(i = 1; i < content_separated.length; i++) {
				if (i%2){ 
					par = content_separated[i].split('<html_prepend_to/>');
					if (par.length > 1) $(par[0]).append(par[1]);
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
		if (content.indexOf('<prepend_separator/>') !== -1) {
			content_separated = content.split('<prepend_separator/>');
			if (content_separated.length > 1){
				jSel.append(content_separated[1]);
				needHtml = false;
			}
		}
		if (content.indexOf('<noservice_separator/>') !== -1) {
			content_separated = content.split('<noservice_separator/>');
			if (content_separated.length > 2){
				content = content_separated[0];
				for(i = 1; i < content_separated.length; i++) {
					if (!(i%2)) content += content_separated[i];
				}
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
	
	/*
	opt = {
		url:'',
		name:'',
		
		langUnsupport:'',
		langFileProcess:'',
		langUploaded:'',
		
		maxSize: 10000000,
		maxFiles: 1,
		oneFileSimple: true,
		allowExt: ['jpg','jpeg','png','gif'],
	multirequests: false
	};
	*/
	this.mUploadForm = function(selector,callback,opt){
		opt = opt || {};
		var def = {
			inputFile : selector+' .mUpload',
			url: '/japi/upload',
			name: 'mFile',
			maxSize: 10000000,
			maxFiles: 1,
			oneFileSimple: true,
			allowExt: ['jpg','jpeg','png','gif'],
			multirequests: false
		};
		var mUploadOpt = $.extend(mthis.copy(def),{
			callUnsupported: function(){
				mjsa.printError(opt.langUnsupport || 'Ваш браузер устарел и не поддерживает современную технологию загрузки файлов');
			},
			callPre: function(obj){
				$(selector).find('.mUpload').hide();
				$(selector).find('.m_progressbar_container').show().find('.track').css('width','0%');
			},
			callProcess: function(obj,info){
				var percent = parseInt( info.loaded * 100 / info.total);
				$(selector).find('.m_progressbar_container .filetrack').css('width',''+percent+'%');
				if (percent >= 99){
					$(selector).find('.m_progressbar_container .counter_text .counter_text_percent').html(opt.langFileProcess || 'Обработка файлa(ов)...');
				} else {
					$(selector).find('.m_progressbar_container .counter_text .counter_text_percent').html((opt.langUploaded || 'Загружено') + ' ' + parseInt(info.loaded / 1024) + ' КB / ' + parseInt(info.total / 1024) + ' KB');
				}
			},
			callAfter: function(obj,doneInfo){
				if (obj === undefined) obj = {};
				if (doneInfo){
					var percent = parseInt(doneInfo.done * 100 / doneInfo.total);
					$(selector).find('.m_progressbar_container .totaltrack').css('width',''+percent+'%');
					$(selector).find('.m_progressbar_container .counter_text .counter_text_files').html(opt.langFileDone || 'Загрузка файлов ('+doneInfo.done+' из '+doneInfo.total+') : ');
					doneInfo.done && mUploadOpt.multirequestsCallback && mUploadOpt.multirequestsCallback(obj.response)
				}
				if (!doneInfo || doneInfo.done === doneInfo.total){
					$(selector).find('.mUpload').show().val('');
					$(selector).find('.m_progressbar_container').hide()
					if (callback) callback(obj.response);
					else mjsa.html(mthis.def.service,obj.response);
				}
				
			}			
		},opt);
		if (opt && opt.cancel) {
			mUploadOpt.action = 'cancel';
			mthis.upload(mUploadOpt);
			return false;
		}
		var html = '<input type="file" class="standart_input mUpload" '+((mUploadOpt.maxFiles > 1)?'multiple':'')+' name="'+mUploadOpt.name+'" />';
		html += '<div class="m_progressbar_container" style="display:none;">';
		if (mUploadOpt.multirequests){
		html	+= '<div class="progressbar"><div class="track totaltrack"></div></div>';
		}
		html	+= '<div class="progressbar"><div class="track filetrack"></div></div>';
		html	+= '<div class="m_cancel'+ ((opt.cancelClass)?' '+opt.cancelClass:'') +'" onclick="return mjsa.mUploadForm(\''+selector+'\',undefined,{cancel:true})">';
		html		+= opt.cancelText || 'Cancel';
		html	+= '</div><div class="counter_text"><span class="counter_text_files"></span><span class="counter_text_percent"></span></div>';
		html += '</div>';
		$(selector).html(html);
		mthis.upload(mUploadOpt);
		return false;
	};	
	/* HTML 5 upload files: used FormData
	var options = {
		inputFile : '#uploadfile',
		url: '/auth/upload_profile_photo',
		name: 'thefiles',
		params: {},
		callUnsupported: function(){alert('Browser is deprecated and not support');},
		callBefore: function(files){}, // return false to cancel upload
		callPre: function(files){}, 
		callProcess: function(e,obj){},
		callAfter: function(obj){},
		callSuccess: function(obj,response){},
		callError: function(obj){},
		maxSize: 823000,
		maxSizeException: function(file){},
		oneFileSimple: false,
		maxFiles: 15,
		maxFilesException: function(file){},
		allowExt: ['jpg','jpeg','png','gif'],
		allowExtException: function(file){},
		multirequests: false, // every file in single request
	}; */
	this.upload = function(opt){
		// TODO: upload drag and drop
		opt = opt || {};
		var http = null;
		opt.url = opt.url || '/upload';
		if (opt.inputFile !== undefined){
			if (opt.action === 'cancel'){
				http = $(opt.inputFile).data('http');
				$(opt.inputFile).val('');
				$(opt.inputFile).data('queue',[]);
				http && http.abort(); // В нек браузерах выхывается error, и соответственно callAfterPriority повторно
				if (opt.callAfterPriority) opt.callAfterPriority();
				else opt.callAfter && opt.callAfter();
				return false;
			}
			$(opt.inputFile).on('change',function(event){
				var files_info = $(this)[0].files;
				if (files_info === undefined || window.FormData === undefined) {
					if (opt.callUnsupported) opt.callUnsupported();
					else mthis.printError('Browser is deprecated and not supported');
				}
				if (!files_info.length) return false;
				if (opt.multirequests){
					var files_info_arr = [];
					for (var i = 0; i < files_info.length; i++) {
						files_info_arr.push(files_info[i]);
					}
					$(opt.inputFile).data('queue',files_info_arr);
					$(opt.inputFile).data('queue_total',files_info_arr.length);
					opt.oneFileSimple = true;
					opt.callAfterPriority = function(e){
						var queue_files_info = $(opt.inputFile).data('queue');
						var total = $(opt.inputFile).data('queue_total');
						var done = total - queue_files_info.length;
						if (queue_files_info.length){
							var sub_files_info = [];
							sub_files_info.push(queue_files_info.shift());
							$(opt.inputFile).data('queue',queue_files_info);
							
							http = mthis._upload(sub_files_info, opt);
							$(opt.inputFile).data('http',http);
						}
						if (opt.callAfter) {
							return opt.callAfter(e,{done:done,total:total});
						}
						return false;
					};
					opt.callAfterPriority(undefined);
				} else {
					http = mthis._upload(files_info,opt);
					$(opt.inputFile).data('http',http);
				}
			});
		}
		return http; 
	};
	this._upload = function(files_info,opt){
		if (opt.callBefore && !opt.callBefore(files_info)) return false;
		var files = [];
		for (var i = 0; i < files_info.length; i++) {
			if (opt.maxSize && files_info[i].size && files_info[i].name && files_info[i].size > opt.maxSize){
				if (opt.maxSizeException) opt.maxSizeException(files_info[i]);
				else mthis.printError('File '+ files_info[i].name + ' is too large. Max file size is '+ parseInt(opt.maxSize /1024) + ' KB.');
				continue;
			} else if ((opt.allowExt && files_info[i].name) 
				&& (!mthis.inArray(files_info[i].name.slice(files_info[i].name.lastIndexOf('.')+1).toLowerCase(), opt.allowExt))){
					if (opt.allowExtException) opt.allowExtException(files_info[i]);
					else mthis.printError('File '+ files_info[i].name + ' is not allowed');
			} else if (opt.maxFiles && files.length >= opt.maxFiles){
				if (opt.maxFilesException) opt.maxFilesException(files_info[i]);
				else mthis.printError('File '+ files_info[i].name + ' is not to be upload. Max files to upload is '+opt.maxFiles+' .' );
			} else {
				files.push(files_info[i]);
			}
		}
		if (!files.length) return false;
		var http = new XMLHttpRequest();
		if (http.upload && http.upload.addEventListener) {
			http.upload.addEventListener('progress',function(e) {
				if (e.lengthComputable && opt.callProcess) opt.callProcess(e,{loaded:e.loaded, total:e.total});
			},false);
			http.onreadystatechange = function () {
				if (this.readyState == 4) {
					if (opt.callAfterPriority) opt.callAfterPriority(this);
					else opt.callAfter && opt.callAfter(this);
					if(this.status == 200) {
						opt.callSuccess && opt.callSuccess(this,this.response);
					} else {
						opt.callError && opt.callError(this);
					}
				}
			};
			http.upload.addEventListener('load',function(e) {
				// Событие после которого также можно сообщить о загрузке файлов.// Но ответа с сервера уже не будет.// Можно удалить.
			});
			http.upload.addEventListener('error',function(e) {
				if (opt.callAfterPriority) opt.callAfterPriority(this);
				else opt.callAfter && opt.callAfter(this);
				opt.callError && opt.callError(this);
				console.log('m_error'); console.log(e); // Паникуем, если возникла ошибка!
			});
		}
		var form = new FormData(); 
		//form.append('path', location.href);
		if (opt.params){
			var params = mthis.get(opt.params);
			for (var key in params) form.append(key, params[key]);
		}
		if (!opt.name) opt.name = 'thefiles';
		for (var i = 0; i < files.length; i++) {
			form.append(opt.name+((opt.oneFileSimple)?'':'[]'), files[i]);
		}
		if (opt.callPre) opt.callPre(files);
		http.open('POST', opt.url);
		http.send(form);
		return http;
	};
	
	// GPS Location
	this._callGeoLocationDef = function(position){
		mthis.debug(position);
		mthis.debugParam(position);
	};
	// options = {
	//	timeout: 60000//milliseconds
	//	callNoLocation: function(){} // unavailable get Location
	//	callUnsupported: function(){} 
	//	callAccessDenied: function(){} //
	//	callUnavailablePosition: function(){}
	//	callTimeout: function(){}
	//}
	this.geoLocation = function(func,options){
		options = options || {};
		func = func || mthis._callGeoLocationDef;
		options.timeout = options.timeout || 60000;
		if(!navigator.geolocation){
			options.callUnsupported && options.callUnsupported();
			options.callNoLocation && options.callNoLocation();
			return false;
		}
		navigator.geolocation.getCurrentPosition(
			func, function(err){
				mthis.def.testing && mthis.debug(err);
				if(err.code === 1) {
					options.callAccessDenied && options.callAccessDenied();
				}else if(err.code === 2) {
					options.callUnavailablePosition && options.callUnavailablePosition();
				}else if(err.code === 3) {
					options.callTimeout && options.callTimeout();
				}
				options.callNoLocation && options.callNoLocation();
			},options
		);
		return false;
	};

	/* LocalStorage and SessionStorage
	opt = {local: true, clear:true, callUnsupported: function(){}} */
	this.webStorage = function(opt,key,value){
		opt = opt || {};
		var storeType = undefined;
		if (opt.local) storeType = window.localStorage;
		else storeType = window.sessionStorage;
		if (!storeType){
			opt.callUnsupported && opt.callUnsupported();
			return false;
		}
		if (opt.clear) {
			storeType.clear();
			return false;
		}
		if (key===undefined) return false;
		if (value===undefined){
			var ret, ret_json_maybe = storeType.getItem(key);
			if (ret_json_maybe){
				try{
					ret = JSON.parse(ret_json_maybe);
				} catch(e){
					ret = ret_json_maybe;
				}
			}
			return ret;
		}
		if (value===null){
			storeType.removeItem(key);
			return false;
		}
		if (typeof value === 'object'){
			storeType.setItem(key,JSON.stringify(value));
		} else {
			storeType.setItem(key,value);
		}
		
		return false;
	};
	
	
	/* selected text on window */ 
	this._getSelection = function(w){
		var ie = false, si = undefined;
		if ( w.getSelection ) { 
			si = w.getSelection(); 
		} else if ( w.document.getSelection ) { 
			si = w.document.getSelection(); 
		} else if ( w.document.selection ) { 
			ie = true;
			si = w.document.selection.createRange(); 
		} 
		if(!ie){
			var range = (si.rangeCount)?si.getRangeAt(0):w.document.createRange();
			var d = w.document.createElement('div'); 
			d.appendChild(range.cloneContents());
			return {text:si.toString(), html:d.innerHTML, range:range,si:si };
		} else {
			return {text:si.text, html:si.htmlText, ieRange:si};
		}		
	};
	this._toSelection = function(w, sel, text){
		if(sel.range){
			var root = sel.range.commonAncestorContainer;
			sel.range.deleteContents();
			var d = w.document.createElement('div'); d.innerHTML = text; 
			var docFragment = w.document.createDocumentFragment();
			while (d.firstChild) { 
				docFragment.appendChild(d.firstChild) ;
			}; 
			sel.range.collapse(false); 
			sel.range.insertNode(docFragment);
			return root;
		} else if(sel.ieRange){
			sel.selectedText.pasteHTML(text); return undefined;
		} else {
			console.log('incorrect selection'); return false;
		}
		
	};
	this.selected = function(opt){
		opt = opt || {};
		var w = opt.window || window;
		
		var sel = mthis._getSelection(w);
		
		if (opt.replace){
			var root = mthis._toSelection(w,sel,opt.replace(sel));
			//if (root && !opt.nocorrect) $(root).html($(root).html().replace(/<[^\/>][^>]*>[^<]<\/[^>]+>/gim, ''));
			if (root && !opt.noEmptyCorrect) $(root).parent().parent().find('p,b,i,u,strong,em').filter('*:empty').remove();
			if (root && !opt.noInCorrect) {
				$(root).parent().parent().find('b b,strong strong,i i,em em,u u').each(function(){
					var $parent = $(this).parent(); $parent.html($parent.text());
				});
			}
			sel = mthis._getSelection(w);
		}
		
		return sel;
	};
	this.textSelected = function(selector,opt){ // Thanks http://forum.php.su/topic.php?forum=46&topic=13
		opt = opt || {};
		var $sel = $(selector).filter('input,textarea');
		if (!$sel.length) { console.log('selector not found'); return false; }
		var elem = $sel.get(0);
		var selText = ''; 
		if (elem.selectionStart !== undefined) { 
			selText = elem.value.substring(elem.selectionStart, elem.selectionEnd);
			if (opt.replace && selText !== ''){
				selText = opt.replace(selText);
				elem.value = elem.value.substring(0,elem.selectionStart) + selText + elem.value.substring(elem.selectionEnd);
			}
		} else { // IE
			var textRange = document.selection.createRange ();
			selText = textRange.text;
			if (opt.replace  && selText !== ''){
				selText = opt.replace(selText);
				var rangeParent = textRange.parentElement ();
				if (rangeParent === elem){textRange.text = selText;}
			}
		}
		return selText;
	};
	this.getTimezone = function(){ // Thanks http://paperplane.su/php-timezone/
		var now = new Date(); 
		var timezone = { offset: 0, dst: 0};
		timezone.offset = now.getTimezoneOffset();
		var d1 = new Date(); var d2 = new Date();
		// Первую дату установим на 1 января текущего года
		 d1.setDate(1); d1.setMonth(1);
		// Вторую дату установим на 1 июля текущего года
		 d2.setDate(1); d2.setMonth(7);
		// Если смещение часовых поясов совпадают, то поправка на летнее время отсутствует
		if(parseInt(d1.getTimezoneOffset()) == parseInt(d2.getTimezoneOffset())) {
			 timezone.dst = 0;
		} else { // если поправка на летнее время существует, то проверим активно ли оно в данный момент
			 // Выясним в каком полушарии мы находимся в северном или южном
			 // Разница будет положительной для северного и отрицательной для южного
			 var hemisphere = parseInt(d1.getTimezoneOffset()) - parseInt(d2.getTimezoneOffset());
			 if((hemisphere > 0 && parseInt(d1.getTimezoneOffset()) == parseInt(now.getTimezoneOffset())) 
				|| (hemisphere < 0 && parseInt(d2.getTimezoneOffset()) == parseInt(now.getTimezoneOffset()))) { 
				 timezone.dst = 0;
			 } else { 
				 timezone.dst = 1;
			 }
		}
		return timezone;
	};

	/* 
	opt = {
		once: false, 
		toSelector: '#to',
		url: '/ajax/autocomlete'
		params: {}, 
		collect: '.ac_param', 
		minchars: 3
		dataType: 'jsonp'
		callBefore: function(params,el,keyup_event){
			if (params.query.length < 3) {clear(); return false;}
			if (iWantAddParam){
				params.newparam = 'myvalue';
				return params;
			}
			return true;
		}, some user interception
		callAfter: function(param,response)
	}
	*/
	this.autocomplete = function(input_selector,options){
		var defOpt = {
			toSelector: '#test',
			itemSelector: '.item',
			queryAttr:'data-value',
			selectedClass: 'selected',
			url: '/default/autocomplete',
			params: undefined,// aditional POST params as default
			collect: undefined, // collect values to params
			minchars: 2,
			once: undefined, // init for one time only
			scrollerSelector: undefined
		};
		var opt = $.extend(mthis.copy(defOpt), options || {});
		
		if (opt.crossDomain){
			opt.crossDomain = { crossDomain: true, dataType:'jsonp'};
		} else {
			opt.crossDomain = {};
		}
		
		var hndlr = null;
		var last_query = '';
		var jDoc = document, jSel = input_selector;
		if (opt && opt.once) { jDoc = input_selector; jSel = undefined;}
		$(jDoc).on('keydown', jSel, function(e){
			// Interception up, down,enter, escape keys
			if (e.keyCode && (e.keyCode===38 || e.keyCode===40 || e.keyCode===13 || e.keyCode===27)){ 
				if (e.keyCode===38 || e.keyCode===40){ // up key: select previos item
					var borderSel = ':last';
					if (e.keyCode===40) borderSel = ':first'; //key down
					var $selected = $(opt.toSelector).find(opt.itemSelector+'.'+opt.selectedClass).removeClass(opt.selectedClass);
					if (!$selected.length){
						$selected = $(opt.toSelector).find(opt.itemSelector+borderSel).addClass(opt.selectedClass);
						$(this).attr(opt.queryAttr,$(this).val());
						$(this).val($selected.attr(opt.queryAttr)||$(this).val());
					} else {
						$selected = (e.keyCode===40)?$selected.next(opt.itemSelector).addClass(opt.selectedClass)
									:$selected.prev(opt.itemSelector).addClass(opt.selectedClass);
						if (!$selected.length) {
							$(this).val($(this).attr(opt.queryAttr)||$(this).val());
						} else {
							$(this).val($selected.attr(opt.queryAttr)||$(this).val());
						}
					}
					opt.callChoose && opt.callChoose($selected,opt);
					if(opt.callScroller) { 
						opt.callScroller($selected,opt); 
					} else {
						if (opt.scrollerSelector){
							var $scroller = $(opt.toSelector).find(opt.scrollerSelector);
							if ($selected.length && opt.scrollerSelector){
								var contentHeight = $scroller[0].scrollHeight;
								var scrollTop = $scroller.scrollTop();
								var scrollHeight = $scroller.height();
								var maxScrollTop = contentHeight - scrollHeight;
								if ($selected[0].offsetTop < scrollTop
									|| $selected[0].offsetTop+$selected.height() > scrollTop + scrollHeight
								){
									var scrollTo = $selected[0].offsetTop;
									if (scrollTo > maxScrollTop) scrollTo = maxScrollTop;
									$scroller.scrollTop(scrollTo);
								}
							} else {
								$scroller.scrollTop(0);
							}
						}
					}
				}
				e.preventDefault();
				e.stopImmediatePropagation();
				return false;
			}
		});
		$(jDoc).on('keyup paste', jSel, function(e){
			// Interception up, down,enter, escape keys
			if (e.keyCode && (e.keyCode===38 || e.keyCode===40 || e.keyCode===13 || e.keyCode===27)){
				if (e.keyCode===13){ // enter key: select item, event click, and hide autocomplete
					$(opt.toSelector).find(opt.itemSelector+'.'+opt.selectedClass).removeClass(opt.selectedClass).click();
					$(opt.toSelector).html('').hide();
				}
				if (e.keyCode===27){ // escape key, hide autocompleate
					$(opt.toSelector).html('').hide();
				}
				e.preventDefault();
				e.stopImmediatePropagation();
				return false;
			}
			opt.params = mthis.get(opt.params) || {};
			opt.url = opt.url || '';
			var self = this;
			if (self.hndlr) clearTimeout(self.hndlr);
			self.hndlr = setTimeout(function() {
				clearTimeout(self.hndlr); //?
				if (opt.collect){
					opt.params = $.extend(opt.params,mthis.collectParams(opt.collect));
				}
				opt.params.query = $(self).val();
				if (opt.minchars){
					if (opt.params.query.length < opt.minchars){
						$(opt.toSelector).html('').hide();
						return false;
					}
				}
				if (opt.callBefore !== undefined) {
					var ret = opt.callBefore(opt.params,self,e);
					if (ret === false) return false;
					if (ret.query !== undefined) opt.params = ret;
				}
				last_query = opt.params.query;
				$(self).attr(opt.queryAttr,last_query);
				$.ajax($.extend({url:opt.url, data:opt.params, type: opt.ajaxType || "POST", dataType: opt.dataType || "html", 
				success:function(data) {
					try {
						var obj = (typeof data === 'object') ? data : JSON.parse(data);
						if (obj.query === last_query) {
							if (opt.callAfter === undefined || opt.callAfter(opt.params,self,data) !== false) {
								$(opt.toSelector).show().html(obj.response);
							}
						}
					} catch(ex) {
						console.log('search error: response is:',data);
					}
					self.hndlr = null;
				}},opt.crossDomain));
			}, 400);
			return true;
		});
		return false;
	};

	
	this.onClickEnterInit = function(selector,opt){
		var jDoc = document, jSel = selector;
		if (opt && opt.once) { jDoc = selector; jSel = undefined;}
		$(jDoc).on('keypress', jSel, function(e) {
			e = e || window.event;
			if (e.keyCode===13 || e.keyCode===10){
				if (opt && (opt.ctrl === true) && !e.ctrlKey) return true;
				if (opt && opt.callback) opt.callback.call(this);
			}
			return true;
		});
	};
	this.getByteLength = function(str){ 
		return encodeURIComponent(str).replace(/%../g, 'x').length;
	};
	this.inArray = function(needle, haystack){
		var found = false, key;
		for (key in haystack) {
			if (haystack[key] === needle){ found = true; break; }
		} return found;
	};

	
	return this;
})(jQuery);

// V V V ***** DEFFAULT MODULES ***** V V V
// BEGIN SCROLL POPUP MODULE
mjsa = (function ($){
	var mthis = this;
	this.scrollPopup = (function($){
		var defOptions = {
			width: 600,
			top: 100,
			padding_hor: 15,
			padding_ver: 15,
			modelName: 'mjsa.scrollPopup', // [versionedit]
			mainContainer: '#container',
			loadingBlock: '/pub/images/loader.gif',
			closeBtnClass: undefined,
			zindex: 19,
			callOpen:undefined,
			callClose:undefined
		};
		var m = {};
		m.openedPopups = {};
		m.closeAll = function(){
			for(var key in m.openedPopups){
				if (m.openedPopups[key]) m.close(key);
			}
		};
		m.getOpened = function(){
			for(var key in m.openedPopups){
				if (m.openedPopups[key]) return key;
			} 
			return undefined;
		};
		// [TODO:]
		// 1)add support escape button to close opened popups
		m._createPopup = function(options){
			// style
			var contSelector = '.scoll_popup_container.'+options.name;
			var str_html = '<style>';
			str_html += contSelector+' .popup_scroll_shadow{z-index: '+options.zindex+';}';
			str_html += contSelector+' .popup_scroll_loading{z-index: '+(options.zindex+1)+';}';
			str_html += contSelector+' .popup_scroll{width: '+(options.width+options.padding_hor)+'px; top: '+options.top+'px; margin-left: -'+((options.width+options.padding_hor)/2)+'px; z-index: '+(options.zindex+1)+';}';
			str_html += contSelector+' .popup_scroll_content{padding: '+options.padding_ver+'px '+options.padding_hor+'px; }';
			str_html += '</style>';
			// shadow
			str_html += '<div class="popup_scroll_shadow toggle_popup_scroll" onclick="return '+options.modelName+'.close(\''+options.name+'\')"></div>';
			// popup container
			str_html += '<div class="popup_scroll_loading" onclick="return '+options.modelName+'.close(\''+options.name+'\')">'+options.loadingBlock+'</div>';
			str_html += '<div class="popup_scroll toggle_popup_scroll">';
				// popup body
				str_html += '<div class="popup_scroll_body">';
					// popup close botton
					if (options.closeBtnClass !== undefined) {
						str_html += '<div href="#" class="close_popup_scroll';
						if (options.closeBtnClass) str_html += ' '+options.closeBtnClass;
						str_html += '" onclick="return '+options.modelName+'.close(\''+options.name+'\')"></div>';
					}
					// popup content
					str_html += '<div class="popup_scroll_content"><br/><br/><br/>What?</div>';
				str_html += '</div>';
			str_html += '</div>';
			$(options.selector).html(str_html);
			return false;
		};
		m._shadow = function(selector,show){
			var options = $(selector).data('options');
			if (show) {
				$(options.selector+' .popup_scroll_shadow').show();
			} else {
				$(options.selector+' .popup_scroll_shadow').hide();
			}
			if (m.getOpened()) return false;
			if (show){
				var nowpos = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
				var con_width = $(options.mainContainer).css('width');
				var body_width = $('body').css('width');
				var con_width1 = parseInt(con_width);
				var body_width1 = parseInt(body_width);
				var left_p1 = (body_width1 - con_width1)/2;
				$(options.mainContainer).css('position', 'fixed').css('width','100%');
				$(options.mainContainer).css('top', '-'+nowpos+'px');
				$(options.mainContainer).css('left', ''+left_p1+'px');
				options.nowpos = nowpos;
			} else{
				$(options.mainContainer).css('position', 'relative');
				$(options.mainContainer).css('top', 'auto');
				$(options.mainContainer).css('left', 'auto');
				mthis.scrollTo(options.nowpos,{timer:0})
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
		m._createParent = function(name){
			if (!($('#'+name).length > 0)) {
				$('body').append('<div id="'+name+'" class="scoll_popup_container '+name+'"> </div>');
			}
			return false;
		};
		m._into = function(selector, data){
			var options = $(selector).data('options');
			mthis.html($(selector).find('.popup_scroll_content'),data);
			if (options.callOpen !== undefined) {
				options.callOpen();
			}
			return false;
		};
		m._getSelector = function(name){
			return '#'+name;
		};
		m.init = function(name, options){
			this._createParent(name);
			options.name = name;
			options.selector = '#'+name;
			var opt = $.extend(mthis.copy(defOptions), options);
			$(options.selector).data('options',opt);
			this._createPopup(opt);
			return false;
		};
		
		m.open = function(name, url, content){
			var selector = m._getSelector(name);
			m._shadow(selector,true);
			m._loading(selector,true);
			
			m.openedPopups[name] = true;
			var tthis = this;
			if (url !== undefined) {
				mthis._ajax({
					url: url, type: 'GET', data: {}, timeout:mthis.def.bodyAjax_timeout,
					success:function(data){ 
						tthis._loading(selector,false);
						tthis._showPopup(selector);
						tthis._into(selector,data);
					},
					error:function(jqXHR, textStatus, errorThrown){
						tthis.close(selector.split('#').join(''));
						mthis._defAjaxError(jqXHR, textStatus, errorThrown);
					}
				});
			} else if (content !== undefined && content !== '') {
				this._loading(selector,false);
				this._showPopup(selector);
				this._into(selector,content);
				return false;
			}
			return false;
		};
		m.close = function(name){
			var selector = m._getSelector(name);
			var options = $(selector).data('options');
			if (!options) return false;
			if (!m.openedPopups[name]) return false;
			m.openedPopups[name] = undefined;
			$(options.selector).find('.toggle_popup_scroll').hide();
			m._loading(selector,false); 
			m._shadow(selector,false);
			if (options.callClose !== undefined) {
				options.callClose();
			}
			$(options.selector).find('.popup_scroll_content').html('');
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
