	/*
	mades js ourtravel paging mjsa pugin
	v1.0.0.1
	Last Mod: 2013-02-04 13:00
	*/

mjsa = (function ($){
	this.jsPaging = (function($){
		var m = {};
		var defOptions = {
			module_name: 'mjsa.jsPaging',
			page_element: '.page_element',
			element_exist_attr: 'elem_exist',
			paging_selector: '.m_paging',
			nofind_selector: '.m_noreviewsfind',
			perPage: 20,
			pageOpen: 1,
			loading_image: '/views/i/loadermap.gif',
			zindex: 19
		}
		m._createPageingHtml = function(selector, count_items){
			var opt = $(selector).data('options');
			var pages = ((count_items - 1) / opt.perPage | 0) + 1; // count pages
			var from = opt.perPage * (opt.pageOpen - 1);
			var str = '';
			str += '<p class="pages">';
				str += ' Результат: <span class="hotel_count_title_showed">';
				str += (from+1<count_items)?from+1:count_items;
				str	+= '-';
				str += (from+opt.perPage<count_items)?from+opt.perPage:count_items;
				str += '</span>';
				str += ' из <span class="hotel_count_title">'+count_items+'</span> ';
				str += ' <i class="hotel_pages_panel"> ';
					str += 'Страницы:  ';
					var before_page_exist = false;
					for (var i = 1; i <= pages; i++){
						if ((i === 1) || (i === pages) || (Math.abs(i - opt.pageOpen)<3)){
							if (before_page_exist === true) {
								str += ' , ';
							}
							before_page_exist = true;
							if (i === opt.pageOpen) {
								str += ' <span class="selected" style="background-color: #3B5998; color:#fff; text-decoration: none; padding: 2px; font-weight: 700;">'+i+'</span> ';
							} else {
								str += ' <a href="#" onclick="return '+opt.module_name+'.selectPage(\''+selector+'\','+i+')">'+i+'</a> ';
							}
						} else {
							if (before_page_exist) {
								str += ' ... ';
							}
							before_page_exist = false;
						}
					}
				str += ' </i> ';
			str += '</p>';
			$(selector).find(opt.paging_selector).html(str);
			return false;
		}
		m.selectPage = function(selector, page_num){
			var opt = $(selector).data('options');
			opt.pageOpen = page_num;
			$(selector).data('options',opt);
			var exist_count = $(selector).find(opt.page_element).filter('['+opt.element_exist_attr+'=yes]').length;
			m._createPageingHtml(selector, exist_count);
			var from = opt.perPage * (opt.pageOpen - 1);
			var total_showed = $(selector).find(opt.page_element).hide().filter('['+opt.element_exist_attr+'=yes]').slice(from, from + opt.perPage).show().length;
			if (total_showed === 0)  $(selector).find(opt.nofind_selector).show(); 
			else $(selector).find(opt.nofind_selector).hide(); 
			return false;
		}
		m.filter = function(selector, func){
			var opt = $(selector).data('options');
			$(selector).find(opt.page_element).each(function(){
				if (func(this)){
					$(this).attr(opt.element_exist_attr,'yes');
				} else {
					$(this).attr(opt.element_exist_attr,'no');
				}
			});
			opt.pageOpen = 1;
			$(selector).data('options',opt);
			m.selectPage(selector,1);
			return false;
		}
		m.init = function(selector, options){
			options['selector'] = selector;
			var opt = $.extend(defOptions, options);
			$(selector).data('options',opt);
			return false;
		}
		return m;
	}($));	
	return this;
}).call(mjsa,jQuery);

/*

Version History

v1.0.0.1



*/
/*

 
 
 
 
 
 

*/
