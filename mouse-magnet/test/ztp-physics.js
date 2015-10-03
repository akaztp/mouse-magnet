$(window).load(function () {
	'use strict';

	var config =
	{
		drag: 0.6,
		particleSelector: '#ztp-photo li img',
		boundsSelector: '#Area3',
		attraction: false,
		autoPoke: 5, // in seconds
		lowCpuDetect: true
	}

	var mm = new MouseMagnet(config);
	mm.start();

	$('#ztp-photo').mouseleave(shuffle);

	function shuffle(evt)
	{
		var seed = Math.floor(Math.random() * 4);
		$('#ztp-photo li').each(
			function (idx, elem)
			{
				$(elem).css('left', ((idx + seed) >> 1) % 2 ? 64 : 0).css('top', ((idx + seed) % 2) ? 0 : 64);
			});
		mm.reposition();
	}

});