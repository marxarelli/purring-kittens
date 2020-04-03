'use strict';
const
	dualShock = require('dualshock-controller'),
	Emitter = require('events').EventEmitter,
	util = require('util');

const Controller = function() {
	Emitter.call(this);

	const
		intensityStep = 10,
		intervalStep = 200,
		ctrls = [
			dualShock({
				config: "dualshock4-alternate-driver",
				logging: true,
				index: 0
			}),
			dualShock({
				config: "dualshock4-alternate-driver",
				logging: true,
				index: 1
			}),
		];

	var
		intensity = 60,
		interval = 2000,
		isOn = false,
		side = 0,
		other = 0,
		switched = false,
		stimulating;

	const stimulate = () => {
		if (isOn) {
			other = side;
			side = (side == 0) ? 1 : 0;

			ctrls[side].setExtras({
				red: 0,
				green: 255,
				rumbleLeft: intensity,
			});
			ctrls[other].setExtras({
				red: 0,
				green: 255,
				rumbleLeft: 0,
			});

			this.emit('stimulate', { side: switched ? other : side, intensity: intensity });
		} else {
			ctrls[0].setExtras({
				red: 255,
				green: 0,
				rumbleLeft: 0,
			});
			ctrls[1].setExtras({
				red: 255,
				green: 0,
				rumbleLeft: 0,
			});
		}
	};

	stimulate();

	for (var i = 0; i < ctrls.length; i++) {
		var ctrl = ctrls[i];

		ctrl.on("circle:press", d => this.switch());
		ctrl.on("x:press", d => this.toggle());
		ctrl.on("dpadRight:press", d => this.adjInterval(1));
		ctrl.on("dpadLeft:press", d => this.adjInterval(-1));
		ctrl.on("dpadUp:press", d => this.adjIntensity(1));
		ctrl.on("dpadDown:press", d => this.adjIntensity(-1));
	};

	this.reset = () => {
		if (stimulating !== undefined) {
			clearInterval(stimulating);
		}
		stimulating = setInterval(stimulate, interval);
		stimulate();

		console.log('interval', interval);
		console.log('intensity', intensity);

		this.emit(
			'change',
			{ stimulating: isOn, interval: interval, intensity: intensity }
		);
	};

	this.adjIntensity = (val) => {
		return this.setIntensity(intensity + (intensityStep * val));
	};

	this.adjInterval = (val) => {
		return this.setInterval(interval + (intervalStep * val));
	};

	this.intensity = (v) => (v === undefined) ? intensity : this.setIntensity(v);
	this.interval = (v) => (v === undefined) ? interval : this.setInterval(v);

	this.setIntensity = (value) => {
		intensity = Math.max(Math.min(value, 255), 0);
		this.reset();

		return intensity;
	};

	this.setInterval = (value) => {
		interval = Math.max(Math.min(value, 5000), 200);
		this.reset();

		return interval;
	};

	this.switch = () => {
		switched = switched ? false : true;
	};

	this.toggle = () => {
		isOn = !isOn;
		this.reset();

		return isOn;
	};

	this.turnOff = () => {
		isOn = false;
		this.reset();
	};

	this.turnOn = () => {
		isOn = true;
		this.reset();
	};
}

util.inherits(Controller, Emitter);

module.exports = {
	Controller: Controller,
};
