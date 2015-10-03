function MouseMagnet(config)
{
	'use strict';

	var t = this;
	t.config = config;
	t.elemsPhysics = [];

	if (typeof t.start !== "function")
	{
		MouseMagnet.prototype.start = start;
		MouseMagnet.prototype.toggle = toggle;
		MouseMagnet.prototype.reposition = reposition;
	}

	t._lowCpuData = 
	{
		lastRenderTime: null,
		detectedCycles: 0
	}

	t._inited = true; // true until any interaction
	t._physics = new Physics(0, t.config.drag);

	t._mouseParticle = t._physics.makeParticle(1, 0, 0);
	t._mouseParticle.makeFixed();

	t._pokeInterval = null;
	if (t.config.autoPoke)
		t.pokeInterval = window.setInterval(_poke, t.config.autoPoke * 1000, t);


	function start()
	{
		var t = this;
		_setupPhysics(t._physics, t.config.particleSelector, t.elemsPhysics, t.config.attraction, t._mouseParticle);
		t._physics.onUpdate(
			function ()
			{
				_renderPhysics.apply(t, null);
			});
		t._physics.play();
		$('body').mousemove(t, _onMouseMove);
		$(t.config.boundsSelector).mouseenter(t, _onMouseEnter);
		$(t.config.boundsSelector).mouseleave(t, _onMouseLeave);

		$(window).resize(
			function ()
			{
				reposition.apply(t, null);
			});
	}

	function toggle()
	{
		var t = this;
		t._physics.toggle();
		t.elemsPhysics.forEach(
			function (elemPhysics)
			{
				elemPhysics.elem.css('left', '0');
				elemPhysics.elem.css('top', '0');
			});
	}


	function _setupPhysics(physics, elemsSelector, elemsPhysics, attraction, mouseParticle) {
		$(elemsSelector).each(
			function (idx, domElem) {
				var elemPhysics = { elem: $(domElem) };
				elemPhysics.pos = elemPhysics.elem.offset();
				elemPhysics.dim = { width: elemPhysics.elem.width(), height: elemPhysics.elem.height() };
				elemPhysics.middlePos = { left: elemPhysics.pos.left + elemPhysics.dim.width / 2.0, top: elemPhysics.pos.top + elemPhysics.dim.height / 2.0 };
				elemPhysics.dolly = physics.makeParticle(1, elemPhysics.middlePos.left, elemPhysics.middlePos.top);
				elemPhysics.anchor = physics.makeParticle(1, elemPhysics.middlePos.left, elemPhysics.middlePos.top);
				elemPhysics.anchor.makeFixed();
				elemPhysics.attraction = physics.makeSpring(elemPhysics.anchor, elemPhysics.dolly, 0.5, 0.5, 0);
				elemPhysics.repulsion = physics.makeAttraction(elemPhysics.dolly, mouseParticle, (attraction ? 1 : -1) * 50000, 20); // -100000, 0
				elemPhysics.repulsion.on = false; // at start, assume mouse is off bounds
				elemsPhysics.push(elemPhysics);
			});
	}

	function _onMouseMove(evt) {
		var mousePos = { top: evt.pageY, left: evt.pageX };
		evt.data._mouseParticle.position.x = mousePos.left;
		evt.data._mouseParticle.position.y = mousePos.top;
	}

	function _onMouseEnter(evt) {
		evt.data.elemsPhysics.forEach(
			function (elemPhysics) {
				elemPhysics.repulsion.on = true;
			});
		evt.data._inited = false;
	}

	function _onMouseLeave(evt) {
		evt.data.elemsPhysics.forEach(
			function (elemPhysics) {
				elemPhysics.repulsion.on = false;
			});
		evt.data._inited = false;
	}

	function _renderPhysics()
	{
		var t = this;
		var newRenderTime;
		if (t.config.lowCpuDetect)
		{
			var newRenderTime = new Date().getTime();
			if (!t._lowCpuData.lastRenderTime)
				t._lowCpuData.lastRenderTime = newRenderTime; // force the fps test

			if (newRenderTime - t._lowCpuData.lastRenderTime > 100) // only render if fps is > 10
			{
				if (t._lowCpuData.detectedCycles++ > 5) // avoid false detection of low CPU by some momentarily lag in the browser.
				{
					t._lowCpuData.detectedCycles = 0;
					t.toggle();
					if (t.config.lowCpuCallback)
						t.config.lowCpuCallback();
				}
			}
			else
				t._lowCpuData.detectedCycles = 0;
		}

		t.elemsPhysics.forEach(
			function (elemPhysics) {
				var p = { left: elemPhysics.dolly.position.x - elemPhysics.dim.width / 2.0, top: elemPhysics.dolly.position.y - elemPhysics.dim.height / 2.0 };
				elemPhysics.elem.offset(p);
			});

		t._lowCpuData.lastRenderTime = newRenderTime;
	}

	function reposition()
	{
		var t = this;
		t.elemsPhysics.forEach(
			function (elemPhysics, idx) {
				var prevDollyDelta = { left: elemPhysics.dolly.position.x - elemPhysics.middlePos.left, top: elemPhysics.dolly.position.y - elemPhysics.middlePos.top };
				elemPhysics.elem.css('left', '0').css('top', '0');
				elemPhysics.pos = elemPhysics.elem.offset();
				elemPhysics.dim = { width: elemPhysics.elem.width(), height: elemPhysics.elem.height() };
				elemPhysics.middlePos = { left: elemPhysics.pos.left + elemPhysics.dim.width / 2.0, top: elemPhysics.pos.top + elemPhysics.dim.height / 2.0 };
				elemPhysics.dolly.position.x = elemPhysics.middlePos.left + prevDollyDelta.left;
				elemPhysics.dolly.position.y = elemPhysics.middlePos.top + prevDollyDelta.top;
				elemPhysics.anchor.position.x = elemPhysics.middlePos.left;
				elemPhysics.anchor.position.y = elemPhysics.middlePos.top;
				elemPhysics.anchor.makeFixed();
			});
	}

	function _poke(mm) 
	{
		if (mm._inited)
		{
			var bounds = $(mm.config.particleSelector);
			var pos = _meanPosOffset(bounds);
			var evt = { data: mm };
			_onMouseEnter(evt);
			evt.pageX = pos.left + bounds.width() / 2.0;
			evt.pageY = pos.top + bounds.height() / 2.0
			_onMouseMove(evt);
			window.setTimeout(
				function () {
					if (evt.data._inited)
					{
						evt.pageX = pos.left - 1;
						evt.pageY = pos.top - 1;
						_onMouseMove(evt);
						_onMouseLeave(evt);
						evt.data._inited = true;
					}
				}, 200);
			mm._inited = true;
		}
		else
			window.clearInterval(mm._pokeInterval);
	}

	function _meanPosOffset(elements)
	{
		var mean = elements.offset();
		var offset;
		elements.each(
			function(idx, elem)
			{
				offset = $(elem).offset();
				mean.top = (mean.top + offset.top) / 2.0;
				mean.left = (mean.left + offset.left) / 2.0;
			});
		return mean;
	};
};