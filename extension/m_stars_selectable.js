/*
	mades js m_stars_selectable
	v1.0.0.1
	Last Mod: 2013-01-29 13:50
*/
var m_stars_selectable = new (function($){
	var defOptions = {
		img_empty: '/hotels/hotel_search/images/star_empty.png',
		img_full: '/hotels/hotel_search/images/star_full.png',
		img_selector: '.m_s_star',
		img_value_attr: 'value',
		input_hidden_selector: '.m_stars_selected'
	}
	var fillNeedImages = function(el, opt, count_selected){
		$(el).find(opt.img_selector).each(function(){
			if (parseInt($(this).attr(opt.img_value_attr)) <= count_selected){
				$(this).attr('src', opt.img_full);
			} else {
				$(this).attr('src', opt.img_empty);
			}
		});
	}
	this.init = function(selector,options){
		var opt = $.extend(defOptions, options);
		$(selector).mouseleave(function(){
			var count_selected = parseInt($(this).find(opt.input_hidden_selector).val());
			fillNeedImages(this, opt, count_selected);
		});
		$(selector).find(opt.img_selector).click(function(){
			var count_selected = parseInt($(this).attr(opt.img_value_attr));
			$(selector).find(opt.input_hidden_selector).val(count_selected);
		});
		$(selector).find(opt.img_selector).mouseenter(function(){
			var count_selected = parseInt($(this).attr(opt.img_value_attr));
			fillNeedImages(selector, opt, count_selected);
		})
	}
})(jQuery);

/*

History Version

v1.0.0.1
created


// INSTRUCTIONS:

<div class="circle_rating">
  <img src="/views/i/circle_rating_empty.png" alt="" class="m_s_star" value="1" />
  <img src="/views/i/circle_rating_empty.png" alt="" class="m_s_star" value="2" />
  <img src="/views/i/circle_rating_empty.png" alt="" class="m_s_star" value="3" />
  <img src="/views/i/circle_rating_empty.png" alt="" class="m_s_star" value="4" />
  <img src="/views/i/circle_rating_empty.png" alt="" class="m_s_star" value="5" />
  <input type="hidden" name="" class="m_stars_selected" value="0" />
</div>

m_stars_selectable.init('.write_review .circle_rating', {
	img_empty: '/views/i/circle_rating_empty.png',
	img_full: '/views/i/circle_rating_full.png',
	img_selector: '.m_s_star',
	input_hidden_selector: '.m_stars_selected'
})
*/