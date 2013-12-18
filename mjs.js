/*
	Mades JavaSctips Alpha-snippets
	Author: Andrei Bogarevich
	License:  MIT License
	Site: https://github.com/madeS/mjsa
	v0.6.8.80
	Last Mod: 2013-12-18 20:00
*/
var mjsa = new (function ($){
	var mthis = this; 
	// Defaults variables
	this.wait_message = undefined; // in easilyAjax - not recommended
	this.def = {
		testing: false,
		appMeetVersion: 600, // old application not supported
		service: '#m_service', // class for executing server JS
		bodyAjax: true,  //true, // set false for old application, and for not support body ajax server side
		bodyAjax_inselector: '#body_cont',  //body, 
		bodyAjax_timeout: 5000,
		bodyAjaxOnloadFunc: undefined,  // reAttach events for dom and etc.
		loadingImg: undefined, // '/pub/images/15.gif',
		haSaveSelector: '.mjs_save', // history ajax save forms inputs selector
		mform: {
			selector: '.m_form', // mForm Selector
			disableClass: 'disable', // mForm disable class when btn pressed
			inSelector: '.in', // mForm inner selector for collect params
			errorSelector: '.in_error', // mForm error selector to set error text
			incorrectClass: 'm_incorrect', // mForm rror class for error input
			service: '#m_service', // mForm class for executing server JS = def.service
			errorSeparator:'<error_separator/>',
			incorrectSeparator:'<incorrect_separator/>'
		},
		hints: {
			containerClass: 'mjs_hints_container', //'mjs_hints_container', undefined for alerts warnings, else need connect mjsa css
			call: undefined, // application alerts or other action
			mainClass: 'mjs_hint',
			successClass: 'mjs_hint_success',
			errorClass: 'mjs_hint_error',
			simpleClass: 'mjs_hint_simple',
			hintLiveMs: 10000
		},
		htmlInterception: undefined,
		test: 'test'
	};
	
	this.copy = function(obj){ return JSON.parse(JSON.stringify(obj)); };
	
	//  *** error message ***
	this.print_error = function(error_msg){
		return mthis.print_hint(error_msg,mthis.def.hints.errorClass);
	};
	this._createHintsContainer = function(){ 
		$('body').append('<div class="'+mthis.def.hints.containerClass+'"></div>');
	};
	this.print_hint = function(hint,className){
		if (mthis.def.hints.containerClass){
			if (!className) className = mthis.def.hints.simpleClass;
			var ms = new Date(); var ms_time = ms.getTime();
			if ($('.'+mthis.def.hints.containerClass).length===0) mthis._createHintsContainer();
			$('.'+mthis.def.hints.containerClass).append('<div class="hint'+ms_time+'" style="display:none; clear:left;"><div class="'+mthis.def.hints.mainClass+' '+className+'">'+hint+'</div></div>');
			$('.'+mthis.def.hints.containerClass).find('.hint'+ms_time).animate({height: "show"}, 300);
			window.setTimeout(function(){
				jQuery('.'+mthis.def.hints.containerClass).find('.hint'+ms_time+'')
					.animate({height: "hide"},{duration:300,done:function(){$(this).remove();}});
			}, mthis.def.hints.hintLiveMs);
		}
		mthis.def.hints.call && mthis.def.hints.call(hint);
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
		mthis.print_error('Error '+jqXHR.status+': '+jqXHR.statusText);
	}
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
	this.scrollTo = function(value,timer){
		if(timer === undefined) timer = 500;
		var item =  $("html,body");
		if(typeof(value)==="number")  {
			item.animate({scrollTop: value},timer);
		} else {
			var sct = $(value).offset().top;
			item.animate({scrollTop: sct},timer);
		}
		return false;
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
				} else if ($(this).is('[take=html]')) { // [deprecated]
					ret[name] = $(this).html(); 
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
			if (el.is('[take=html]')) el.html(collected[key]); // [deprecated]
			if (el.is('.take_html, [data-take=html]')) el.html(collected[key]);
		}
	};
	// easilyPostAjax
	this.easilyPostAjax = function(url, insert_selector, post_obj, post_selector, add_callback, add_precall, opt){
		if (!opt) opt = {};
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
			},
			error: opt.error
		});
		return false;
	};
	
	this.mFormSubmit = function(el,link,options){
		var opt = $.extend(mthis.copy(mthis.def.mform), options || {});
		if ($(el).hasClass(opt.disableClass)) return false; else $(el).addClass(opt.disableClass);
		$(el).parents(opt.selector).find(opt.errorSelector).html('');
		var paramSelector = $(el).parents(opt.selector).find(opt.inSelector).removeClass(opt.incorrectClass);
		mthis.easilyPostAjax(link, opt.service, {}, paramSelector,
			function(response){
				$(el).removeClass(opt.disableClass);
				if (opt.callback && !opt.callback(response,el)) return false;
				var incorrect = mthis.grabResponseTag(response,opt.incorrectSeparator);
				if (incorrect){
					$(el).parents(opt.selector).find('[name='+incorrect+']').addClass(opt.incorrectClass);
				}
				var error_msg = mthis.grabResponseTag(response,opt.errorSeparator);
				if (error_msg){
					$(el).parents(opt.selector).find(opt.errorSelector).html(error_msg);
				}
				return false;
			}, undefined,{
				error: function(jqXHR, textStatus, errorThrown){
					$(el).removeClass(opt.disableClass);
					mthis._defAjaxError(jqXHR, textStatus, errorThrown);
				}
			});
		return false;		
	};
	// *** "HTML5 History" Body Ajax [BETA] ***
	this._get_ajaxShadow = function(){
		var inner = '';
		if(mthis.def.loadingImg) inner += '<img class="mjs_loader" src="'+mthis.def.loadingImg+'">';
		if($('.mjs_ajax_shadow').length === 0) $('body').append('<div class="mjs_ajax_shadow" onclick="$(this).hide();"><div class="inner"></div>'+inner+'</div>'); // [TODO: remove inner, use rgba]
		return $('.mjs_ajax_shadow');
	};
	this._bodyAjax_lastlink = '';
	this.bodyAjax = function(link,opt){
		if (!opt) opt = {};
		var noajax = false; if (opt && opt.el) noajax = $(opt.el).attr('noajax');
		if ((link.indexOf('http') === 0) || !(window.history && history.pushState) || (noajax)) {
			if (mthis.def.testing) { //[testing]
				mthis.debug('not support window.history or full link: '+link+'history:'+window.history);
				console.log('link:',link,'history:',window.history);
			}
			if (document.location.href === link) {document.location.reload(); return false;}
			document.location.href = link; return false;
		}
		if (!$(mthis.def.bodyAjax_inselector).length){
			mthis.def.testing && alert('container not found'); // [testing]
			document.location.href = link; return false;
		}
		if (opt.pushonly) {
			if (!mthis.currentPathname === link){
				mthis.currentPathname = link;
				history.pushState({url:link,title:$('title').html()}, $('title').html(), link);
			}
			return false;
		}
		mthis._get_ajaxShadow().animate({opacity: "show"},150);
		mthis._bodyAjax_lastlink = link;
		mthis._ajax({
			url: link, type: 'GET', data: {body_ajax: 'true'}, timeout:mthis.def.bodyAjax_timeout,
			success:function(content){ 
				var collected = mthis.collectParams(mthis.def.haSaveSelector);
				var content_separated = undefined;
				if (mthis._bodyAjax_lastlink !== link) return false;
				if (content.indexOf('<ajaxbody_separator/>') !== -1) {
					content_separated = content.split('<ajaxbody_separator/>');
					if ((content_separated.length > 1)) { //  && (content.indexOf('<redirect_separator/>') === -1) [edit] something wrong with redirect 
														// [hint] redirect released on server side
						if (mthis.currentPathname === link) opt.nopush = true;
						mthis.currentPathname = link;
						if(!opt.nopush){
							history.pushState({url:link,title:content_separated[0]}, content_separated[0], link);
							if (!opt.noscroll) mthis.scrollTo(0);
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
				mthis._get_ajaxShadow().queue(function(){$(this).animate({opacity: "hide"},150);$(this).dequeue();});
			},
			error:function(jqXHR, textStatus, errorThrown){
				mthis._get_ajaxShadow().queue(function(){$(this).animate({opacity: "hide"},150);$(this).dequeue();});
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
		if (content.indexOf('<mjs_separator/>') === -1) { // quick end
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
				mthis.print_error(content_separated[1]);
			}
		}
		if (content.indexOf('<success_separator/>') !== -1) {
			content_separated = content.split('<success_separator/>');
			if (content_separated.length > 1) {
				mthis.print_hint(content_separated[1],mthis.def.hints.successClass);
			}
		}
		if (content.indexOf('<alert_separator/>') !== -1) {
			content_separated = content.split('<alert_separator/>');
			if (content_separated.length > 1) {
				alert(content_separated[1]);
			}
		}
		if (content.indexOf('<html_replace_separator/>') !== -1) { //[test]
			content_separated = content.split('<html_replace_separator/>');
			for(i = 1; i < content_separated.length; i++) {
				if (i%2){ 
					par = content_separated[i].split('<html_replace_to/>');
					if (par.length > 1) $(par[0]).html(par[1]);
				}
			}
		}
		if (content.indexOf('<html_append_separator/>') !== -1) { // [test]
			content_separated = content.split('<html_append_separator/>');
			for(i = 1; i < content_separated.length; i++) {
				if (i%2){ 
					par = content_separated[i].split('<html_append_to/>');
					if (par.length > 1) $(par[0]).append(par[1]);
				}
			}
		}
		if (content.indexOf('<html_prepend_separator/>') !== -1) { //[test]
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
	/* HTML 5 upload files: used FormData
	var options = {
		input_file : '#uploadfile',
		url: '/auth/upload_profile_photo',
		name: 'thefiles',
		params: {},
		unsupport: function(){alert('Browser is deprecated and not support');},
		before_call: function(files){}, // return false to cancel upload
		pre_call: function(files){}, 
		process_call: function(e,obj){},
		after_call: function(obj){},
		success_call: function(obj,response){},
		error_call: function(obj){},
		max_size: 823000,
		max_size_exception: function(file){},
		max_files: 15,
		one_file_simple: false,
		max_files_exception: function(file){},
		allow_ext: ['jpg','jpeg','png','gif'],
		allow_ext_exception: function(file){}
	}; */
	this.upload = function(opt){
		// TODO: upload drag and drop
		// TODO: abort
		if (!opt) opt = {};
		var http = null;
		if (!opt.url) opt.url = '/upload'
		if (opt.input_file !== undefined){
			$(opt.input_file).on('change',function(event){
				var files_info = $(this)[0].files;
				if (files_info === undefined || window.FormData === undefined) {
					if (opt.unsupport) opt.unsupport();
					else mthis.print_error('Browser is deprecated and not supported');
				}
				if (!files_info.length) return false;
				http = mthis._upload(files_info,opt);
				// load HTTP handler to selector data;
			});
		}
		return http; // note: return null
	};
	this._upload = function(files_info,opt){
		if (opt.bafore_call && opt.bafore_call(files_info) === false) return false;
		var files = [];
		for (var i = 0; i < files_info.length; i++) {
			if (opt.max_size && files_info[i].size && files_info[i].name && files_info[i].size > opt.max_size){
				if (opt.max_size_exception) opt.max_size_exception(files_info[i]);
				else mthis.print_error('File '+ files_info[i].name + ' is too large. Max file size is '+ parseInt(opt.max_size /1024) + ' KB.');
				continue;
			} else if ((opt.allow_ext && files_info[i].name) 
				&& (!mthis.inArray(files_info[i].name.slice(files_info[i].name.lastIndexOf('.')+1).toLowerCase(), opt.allow_ext))){
					if (opt.allow_ext_exception) opt.allow_ext_exception(files_info[i]);
					else mthis.print_error('File '+ files_info[i].name + ' is not allowed');
			} else if (opt.max_files && files.length >= opt.max_files){
				if (opt.max_files_exception) opt.max_files_exception(files_info[i]);
				else mthis.print_error('File '+ files_info[i].name + ' is not to be upload. Max files to upload is '+opt.max_files+' .' );
			} else {
				files.push(files_info[i]);
			}
		}
		var http = new XMLHttpRequest();
		if (http.upload && http.upload.addEventListener) {
			http.upload.addEventListener('progress',function(e) {
				if (e.lengthComputable && opt.process_call) opt.process_call(e,{loaded:e.loaded, total:e.total});
			},false);
			http.onreadystatechange = function () {
				if (this.readyState == 4) {
					opt.after_call && opt.after_call(this);
					if(this.status == 200) {
						opt.success_call && opt.success_call(this,this.response);
					} else {
						opt.error_call && opt.error_call(this);
					}
				}
			};
			http.upload.addEventListener('load',function(e) {
				// Событие после которого также можно сообщить о загрузке файлов.// Но ответа с сервера уже не будет.// Можно удалить.
			});
			http.upload.addEventListener('error',function(e) {
				opt.error_call && opt.error_call(this);
				console.log('m_error'); console.log(e); // Паникуем, если возникла ошибка!
			});
		}
		var form = new FormData(); 
		form.append('path', '/');
		if (opt.params){
			for (var key in opt.params) form.append(key, opt.params[key]);
		}
		if (!opt.name) opt.name = 'thefiles';
		for (var i = 0; i < files.length; i++) {
			form.append(opt.name+((opt.one_file_simple)?'':'[]'), files[i]);
		}
		if (opt.pre_call) opt.pre_call(files);
		http.open('POST', opt.url);
		http.send(form);
		return http;
	};
	
	// GPS Location
	this._geoLocationDefCall = function(position){
		mthis.debug(position);
		mthis.debug_param(position);
	};
	// options = {
	//	timeout: 60000//milliseconds
	//	noLocationCall: function(){} // unavailable get Location
	//	notSupportCall: function(){} 
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
				mthis.def.testing && mthis.debug(err);
				if(err.code === 1) {
					if (options.accessDeniedCall) options.accessDeniedCall();
				}else if(err.code === 2) {
					if (options.unavailablePosCall) options.unavailablePosCall();
				}else if(err.code === 3) {
					if (options.timeoutCall) options.timeoutCall();
				}
				if (options.noLocationCall) options.noLocationCall();
			},options
		);
		return false;
	};

	/* LocalStorage and SessionStorage
	opt = {local: true, clear:true, unsupportCall: function(){}} */
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
		if (!opt) opt = {};
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
		to_selector: '#to',
		url: '/ajax/autocomlete'
		param: {}, 
		collect: '.ac_param', 
		minchars: 3
		call_before: function(param,el,keyup_event){
			if (param.query.length < 3) {clear(); return false;}
			if (iWantAddParam){
				param.newparam = 'myvalue';
				return param;
			}
			return true;
		}, some user interception
		call_after: function(param,response)
	}
	*/
	//[beta]
	this.autocomplete = function(input_selector,options){
		var defOpt = {
			to_selector: '#test',
			itemSelector: '.item',
			selectedClass: 'selected',
			url: '/default/autocomplete',
			param: undefined,// aditional POST params as default
			collect: undefined, // collect values to param
			minchars: 2,
			once: undefined, // init for one time only
		};
		var opt = $.extend(mthis.copy(defOpt), options || {});
		
		var hndlr = null;
		var last_query = '';
		var jDoc = document, jSel = input_selector;
		if (opt && opt.once) { jDoc = input_selector; jSel = undefined;}
		$(jDoc).on('keydown', jSel, function(e){
			// Interception up, down,enter, escape keys
			if (e.keyCode && (e.keyCode===38 || e.keyCode===40 || e.keyCode===13 || e.keyCode===27)){ 
				if (e.keyCode===38){ // up key: select previos item
					var $selected = $(opt.to_selector).find(opt.itemSelector+'.'+opt.selectedClass).removeClass(opt.selectedClass);
					var $selected = (($selected.prev(opt.itemSelector).length)?$selected.prev(opt.itemSelector):$selected.parent().children(opt.itemSelector+':last')).addClass(opt.selectedClass);
				}
				if (e.keyCode===40){ // down key: select next item
					var $selected = $(opt.to_selector).find(opt.itemSelector+'.'+opt.selectedClass).removeClass(opt.selectedClass);
					var $selected = (($selected.next(opt.itemSelector).length)?$selected.next(opt.itemSelector):$selected.parent().children(opt.itemSelector+':first')).addClass(opt.selectedClass);
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
					$(opt.to_selector).find(opt.itemSelector+'.'+opt.selectedClass).removeClass(opt.selectedClass).click();
					$(opt.to_selector).html('').hide();
				}
				if (e.keyCode===27){ // escape key, hide autocompleate
					$(opt.to_selector).html('').hide();
				}
				e.preventDefault();
				e.stopImmediatePropagation();
				return false;
			}
			if (!opt.param) opt.param = {};
			if (opt.url === undefined) opt.url = '';
			var self = this;
			if (hndlr) clearTimeout(hndlr);
			hndlr = setTimeout(function() {
				clearTimeout(hndlr); //?
				if (opt.collect){
					opt.param = $.extend(opt.param,mthis.collectParams(opt.collect));
				}
				opt.param.query = $(self).val();
				if (opt.minchars){
					if (opt.param.query.length < opt.minchars){
						$(opt.to_selector).html('').hide();
						return false;
					}
				}
				if (opt.call_before !== undefined) {
					var ret = opt.call_before(opt.param,this,e);
					if (ret === false) return false;
					if (ret.query !== undefined) opt.param = ret;
				}
				last_query = opt.param.query;
				$.post(opt.url, opt.param, function(data) {
					try {
						var obj = JSON.parse(data);
						if (obj.query === last_query) {
							if (opt.call_after === undefined || opt.call_after(opt.param,data) !== false) {
								$(opt.to_selector).show().html(obj.response);
							}
						}
					} catch(ex) {
						console.log('search error: response is ="'+data+'"');
					}
					hndlr = false; //?
				});
			}, 400);
			return true;
		});
		return false;
	};

	
	// enterclick activate
	this._enterClickDefCall = function(){
		eval($(this).attr("data-onclickenter")); return false;
		eval($(this).attr("onclickenter")); return false; // [deprecated]
	};
	this.onClickEnterInit = function(selector,opt){
		var jDoc = document, jSel = selector;
		if (opt && opt.once) { jDoc = selector; jSel = undefined;}
		$(jDoc).on('keypress', jSel, function(e) { // TODO: keyup, or keydown
			e = e || window.event;
			if (e.keyCode===13 || e.keyCode===10){
				if (opt && (opt.ctrl === true) && !e.ctrlKey) return true;
				if (opt && opt.callback) opt.callback.call(this);
				else mthis._enterClickDefCall.call(this);
			}
			return true;
		});
	};
	//[experemental]
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
		m.openedSelectors = {};
		m.closeAll = function(){
			for(var key in m.openedSelectors){
				if (m.openedSelectors[key]) m.close(key);
			}
		};
		m.getOpened = function(){for(var key in m.openedSelectors){if (m.openedSelectors[key]) return key;}};
		// [TODO:]
		// 1)add support escape button to close opened popups
		m._createPopup = function(options){
			// style
			var str_html = '<style>';
			str_html += options.selector+' .popup_scroll_shadow{ display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; opacity: 0.6; z-index: '+options.zindex+';}';
			str_html += options.selector+' .popup_scroll_loading{ display: none; position: fixed; top: 100px; left: 0; width: 100%; height: 100%;  text-align:center; z-index: '+(options.zindex+1)+';}';
			str_html += options.selector+' .popup_scroll{ display: none; width: '+(options.width+options.padding_hor)+'px; top: '+options.top+'px; left: 50%; margin-left: -'+((options.width+options.padding_hor)/2)+'px; position: fixed; z-index: '+(options.zindex+1)+'; padding: 0 0 20px; min-height:100px; }';
			str_html += options.selector+' .popup_scroll_body{ position: relative;  padding: 13px '+options.padding_hor+'px 15px; line-height: normal; background:#fff; }';
			if (options.close_btn_style !== undefined) {
				str_html += options.selector+' .close_popup_scroll{ '+options.close_btn_style+' }';
			}
			str_html += options.selector+' .popup_scroll_content{ }';
			str_html += '</style>';
			// shadow
			str_html += '<div class="popup_scroll_shadow toggle_popup_scroll" onclick="return '+options.modelName+'.close(\''+options.selector+'\')"></div>';
			// popup container
			str_html += '<div class="popup_scroll_loading" onclick="return '+options.modelName+'.close(\''+options.selector+'\')"><img src="'+options.loading_image+'" alt="loading" style="margin: 0 auto;" /></div>';
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
			$(options.mainContainer).css('position', 'fixed').css('width','100%');
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
			var opt = $.extend(mthis.copy(defOptions), options);
			$(selector).data('options',opt);
			this._createPopup(opt);
			return false;
		};
		m.open = function(selector, url, content){
			m.openedSelectors[selector] = true;
			this._showShadow(selector);
			this._loading(selector,true);
			var thethis = this;
			if (content !== undefined && content !== '') {
				this._loading(selector,false);
				this._showPopup(selector);
				$(selector + ' .popup_scroll_content').html(content);
				return false;
			}
			if (url !== undefined) {
				mthis._ajax({
					url: url, type: 'GET', data: {}, timeout:mthis.def.bodyAjax_timeout,
					success:function(data){ 
						thethis._loading(selector,false);
						thethis._showPopup(selector);
						mjsa.html(selector + ' .popup_scroll_content',data);
					},
					error:function(jqXHR, textStatus, errorThrown){
						thethis.close(selector);
						mjsa._defAjaxError(jqXHR, textStatus, errorThrown);
					}
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
			this._loading(selector,false); 
			$(options.selector+' .toggle_popup_scroll').hide();
			$(options.mainContainer).css('position', 'relative');
			$(options.mainContainer).css('top', 'auto');
			$(options.mainContainer).css('left', 'auto');
			$("html,body").scrollTop(options.nowpos);
			if (options.call_close !== undefined) {
				options.call_close();
			}
			$(selector + ' .popup_scroll_content').html('');
			m.openedSelectors[selector] = undefined;
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

	if (mthis.def.appMeetVersion < 600) {
		//[deprecated functions]


		
	}
	

	
	return this;
}).call(mjsa,jQuery);

// ***** END DEPRECATED ADDON *****


/* 
**************************************************************
Version History

v0.6.8.80
scrollTo timer 500 default
scrollPopup fix: container width 100%;
add fontello_mades_icons to style_mjs.css

v0.6.7.79
mFormSubmit: errorSeparator, incorrectSeparator options

v0.6.5.78
getTimezone - timezone info from js 

v0.6.4.77 (2013-11-27)
_defAjaxError(), components now use _defAjaxError()

v0.6.3.76 (2013-11-25)
bodyAjax htmlInterception hot fix

v0.6.2.75 (2013-11-19)
scrollPopup hot fix for multiple popups (copy default options)

v0.6.1.75 (2013-11-12)
mjs upload. one file simple upload to support standart uploaders
connection error hint in bodyAjax

v0.6.1.74 (2013-11-08)
mjs part: selected - work with selection

v0.6.0.73 (2013-11-03)
change default variables tree
onClickEnterInit: new param: once
new autocompleate - need test alpha

v0.5.18.72 (2013-10-28)
mForm callback disable btn fix

v0.5.17.71 (2013-10-22)
add intervalStack module
scrollTo add time

v0.5.16.70 (2013-10-08)
collectParams: data-value in checkbox

v0.5.15.69 (2013-10-04)
_ajax: connection error hint;

v0.5.15.68 (2013-09-27)
add func: mFormSubmit // replaced coreFormSubmit from app.js

v0.5.14.67 (2013-09-20)
visual fix: _upload
include hint.css by https://github.com/chinchang/hint.css with easy fixes
in_array -> inArray
add def: hintCall
edit func: onClickEnterInit, enterClickDefCallback -> _enterClickDefCall
hotfix: upload unsupport FormData

v0.5.13.66 (2013-09-02)
bodyAjax: fix async links
fix: hints

v0.5.12.65 (2013-09-01)
loadCollectedParams: .take_html, [data-take=html]
onClickEnterInit: attr onclickenter -> data-onenterclick (deprecated)
collectParams, loadCollectedParams: attr name + attr data-name
_get_ajaxShadow add loader image

v0.5.11.64 (2013-07-19)
html: multiple html_replace_separator and etc. - need test
easy fixes

v0.5.10.63 (2013-07-17)
fix: autocoplete (paste event)
add bodyAjax_timeout for scrollPopup
collectParams: .take_html, [data-take=html], ([take=html] - deprecated)

v0.5.9.62 (2013-07-11)
fix: upload (http undefined error)
ext: _ajax (first request timeout)
for bodyajax: timeout 5000ms

v0.5.8.61 (2013-07-08)
fix: bodyAjaxUpdate in old browsers - reload.

v0.5.8.60 (2013-07-07)
scrollPopup: save opened popups, and add closeAll func

v0.5.7.59
upload: return http for abort

v0.5.7.58 (2013-07-06)
Uploading files by html5 FormData
func: in_array, upload

v0.5.6.57 (2013-07-05)
fix: autocomplete(minchars fix)

v0.5.6.56 (2013-07-03)
scrollPopup: use mjsa._ajax, if ajax error - autoclose popup and print hint

v0.5.5.55
func: getPosition (full offset for dom element)

v0.5.4.54
func: autocomplete[need ext]
deprecated autoSearch

v0.5.3.53
ext: autoSearch (options)

v0.5.2.52
ext: bodyAjax (opt.noscroll)

v0.5.2.51
ext: collectParams (support ckeditor)
fix: collectParams (val not required)

v0.5.1.50
fix: scrollPopup hide loading if not loaded

v0.5.1.49
fix: autoSearch $.parseJSON -> JSON.parse

v0.5.1.48
fix: scrollPopup - from content

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
2) upload ( TODO: abort, drag-and-drop)
	http://learn.javascript.ru/xhr-onprogress
	http://habrahabr.ru/post/154097/
	http://xdan.ru/Working-with-files-in-JavaScript-Part-1-The-Basics.html
	http://html5demos.com/file-api
3) scrollPopup ( TODO: esc key - close)
4) Phone input formatter

*/