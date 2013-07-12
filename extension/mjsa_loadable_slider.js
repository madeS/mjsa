	/*
	mades js loadable slider mjsa pugin
	v1.0.0.10
	Last Mod: 2013-01-29 18:00
	*/

mjsa = (function ($){
	this.loadableSlider = (function($){
		var m = {};
		var defOptions = {
			offset: 0,
			count: 6,
			pageOpen: 1,
			modelName: 'mjsa.loadableSlider', // [versionedit]
			url: '/main/undefined',
			urlParams: {},
			loading_image: '/views/i/30.gif',
			zindex: 19
		}
		// формирование контейнера страницы
		m._pageHtml = function(selector,page_num){ 
			var opt = $(selector).data('options');
			var temp_str = '';
			temp_str += '<div class="m_page" num="'+page_num+'" loaded="no" goodloaded="no" style="display:none;">';
			temp_str += '<img src="'+opt['loading_image']+'" style="margin: 10px auto 0;">';
			temp_str += '</div>';
			return temp_str;
		}
		// Если контейнера страницы нету, вставляет контейнер. Если параметра загруженности нету - загружает содержимое
		m._checkPage = function(selector, page_num){ 
			var opt = $(selector).data('options');
			if ($(selector + ' .m_pages .m_page[num='+page_num+']').length == 0) { // не нашло элемент страницы
				if ($(selector + ' .m_pages .m_page[num='+(page_num-1)+']').length >  0) { // нашло предыдущий элемент страницы
					$(selector + ' .m_pages .m_page[num='+(page_num-1)+']').after(m._pageHtml(selector,page_num));
				} else if ($(selector + ' .m_pages .m_page[num='+(page_num+1)+']').length >  0) { // нашло след элемент страницы
					$(selector + ' .m_pages .m_page[num='+(page_num+1)+']').before(m._pageHtml(selector,page_num));
				} else {
					$(selector + ' .m_pages').append(m._pageHtml(selector,page_num));
				}
			}
			if ($(selector + ' .m_pages .m_page[num='+page_num+']').attr('loaded') !== 'yes') {
				mjsa.easilyPostAjax(
					opt['url'], 
					(selector + ' .m_pages .m_page[num='+page_num+']'), 
					$.extend(getAuthData(),
					 $.extend(opt['urlParams'], {page:page_num, count: opt['count'], quest: 'prev_next'})),
					 '#test', function(data){
						 //  Страница успешно загружена
						 if ($(selector + ' .m_pages .m_page[num='+page_num+']').find('.goodloaded').val() === 'yes') {
							 $(selector + ' .m_pages .m_page[num='+page_num+']').attr('goodloaded','yes');
							 m._reshowPrevNext(selector);
						 }
					 }, undefined);
				//  Страница загружена
				$(selector + ' .m_pages .m_page[num='+page_num+']').attr('loaded','yes');

			}
			$(selector).data('options',opt);
			return false;
		}
		m._checkNearPages = function(selector){
			var opt = $(selector).data('options');
			var opened = opt['pageOpen'];
			for(var i = 1; i < 3; i++){
				if ((opened-i) > 0) {
					m._checkPage(selector,opened-i);
				}
				m._checkPage(selector,opened+i);
			}
			return false;
		}
		m._reshowPrevNext = function(selector){
			var opt = $(selector).data('options');
			var opened = opt['pageOpen'];
			if ($(selector + ' .m_pages .m_page[num='+(opened-1)+']').attr('goodloaded') === 'yes'){
				$(selector + ' .m_prev').show();
			} else {
				$(selector + ' .m_prev').hide();
			}
			if ($(selector + ' .m_pages .m_page[num='+(opened+1)+']').attr('goodloaded') === 'yes'){
				$(selector + ' .m_next').show();
			} else {
				$(selector + ' .m_next').hide();
			}
			return false;
		}
		m._selectPage = function(selector, page_num){
			var opt = $(selector).data('options');
			m._checkPage(selector,page_num);
			$(selector + ' .m_pages .m_page').hide();
			$(selector + ' .m_pages .m_page[num='+page_num+']').show();
			opt['pageOpen'] = page_num;
			m._checkNearPages(selector);
			m._reshowPrevNext(selector);
			$(selector).data('options',opt);
			return false;
		}
		m.init = function(selector, options){
			options['selector'] = selector;
			var opt = $.extend(defOptions, options);
			$(selector).data('options',opt);
			m._selectPage(selector,parseInt(opt['pageOpen']));
			return false;
		}
		m.next = function(selector){
			var opt = $(selector).data('options');
			m._selectPage(selector,parseInt(opt['pageOpen']+1));
			return false;
		}
		m.prev = function(selector){
			var opt = $(selector).data('options');
			m._selectPage(selector,parseInt(opt['pageOpen']-1));
			return false;
		}
		return m;
	}($));	
	return this;
}).call(mjsa,jQuery);

/*

Version History

v1.0.0.10
slider created


*/
/*
 EXAMPLE:
 
 <div id="profile_slider_actors_liked" class="m_loadable_slider m_slider" style="min-height: 150px;">
	<div class="m_pages">
		<?php for($i = 0; $i < 3; $i++):?>
			<? $data['actors'] = array_slice($data['actors_all'],$i*$count,$count); ?>
			<?php if (($i === 0) || ($data['actors'])):?>
				<div class="m_page" num="<?=($i+1)?>"  loaded="yes" goodloaded="yes" style="display:none;">
					<? 
						$this->load->view('block_actors_content_simple.tpl.php', $data); 
					?>
					<? if ((!$data['actors'])):?>
						No actors liked
					<? endif;?>
				</div>
			<?php else: ?>	
				<div class="m_page" num="<?=($i+1)?>"  loaded="yes" goodloaded="no" style="display:none;">
				</div>
			<?php endif; ?>
		<?php endfor;?>
	</div>
	<div class="m_prev" onclick="return mjsa.loadableSlider.prev('#profile_slider_actors_liked');" style="display:none;">
		<div class="m_inn"></div>
	</div>
	<div class="m_next" onclick="return mjsa.loadableSlider.next('#profile_slider_actors_liked');" style="display:none;">
		<div class="m_inn"></div>
	</div>
</div>
<script>
	mjsa.loadableSlider.init('#profile_slider_actors_liked',{
			count: <?=$count?>,
			pageOpen: 1,
			modelName: 'mjsa.loadableSlider', // [versionedit]
			url: '/main/get_liked_actors',
			urlParams: {profile_id: <?=$profile_id?>},
			zindex: 19
		});
</script>
 
 
 
 
 
 
 
 

*/
