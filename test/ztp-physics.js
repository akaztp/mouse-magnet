require.config(
	{
		baseUrl: "bower_components/",
		paths: {
			"jquery": "jquery/dist/jquery.min",
			"mouse-magnet": "../../mouse-magnet",
			"physics": "../../bower_components/physics/build/physics"
		}
	});


requirejs(["jquery", "mouse-magnet"], function ($, mm) {

	'use strict';

	$(function () {

		var config =
		{
			drag: 0.6,
			particleSelector: '#ztp-photo li img',
			boundsSelector: '#Area3',
			attraction: false,
			autoPoke: 5, // in seconds
			lowCpuDetect: true
		}

		var m = new mm(config);
		//	var mm = new MouseMagnet(config);
		m.start();

		$('#ztp-photo').mouseleave(shuffle);

		function shuffle(evt) {
			var seed = Math.floor(Math.random() * 4);
			$('#ztp-photo li').each(
				function (idx, elem) {
					$(elem).css('left', ((idx + seed) >> 1) % 2 ? 64 : 0).css('top', ((idx + seed) % 2) ? 0 : 64);
				});
			m.reposition();
		}

	});
});