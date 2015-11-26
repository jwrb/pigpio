'use strict';

var EventEmitter = require('events').EventEmitter,
  fs = require('fs'),
  pigpio = require('bindings')('pigpio.node'),
  util = require('util'),
  initialized = false;

function initializePigpio() {
  if (!initialized) {
    pigpio.gpioInitialise();
    initialized = true;
  }
}

function Gpio(gpio, options) {
  if (!(this instanceof Gpio)) {
    return new Gpio(gpio, options);
  }

  initializePigpio();

  options = options || {};

  this.gpio = +gpio;

  if (typeof options.mode === 'number') {
    this.mode(options.mode);
  }

  if (typeof options.pullUpDown === 'number') {
    this.pullUpDown(options.pullUpDown);
  }

  if (typeof options.edge === 'number') {
    this.enableInterrupt(options.edge,
      typeof options.timeout === 'number' ? options.timeout : 0
    );
  }

  EventEmitter.call(this);
}

util.inherits(Gpio, EventEmitter);
module.exports.Gpio = Gpio;

Gpio.prototype.mode = function (mode) {
  // What happens if the mode is INPUT, there is an ISR, and the mode is
  // changed to OUTPUT (or anything else for that matter)?
  pigpio.gpioSetMode(this.gpio, +mode);
  return this;
};

Gpio.prototype.getMode = function () {
  return pigpio.gpioGetMode(this.gpio);
};

Gpio.prototype.pullUpDown = function (pud) {
  pigpio.gpioSetPullUpDown(this.gpio, +pud);
  return this;
};

Gpio.prototype.digitalRead = function () {
  return pigpio.gpioRead(this.gpio);
};

Gpio.prototype.digitalWrite = function (level) {
  pigpio.gpioWrite(this.gpio, +level);
  return this;
};

Gpio.prototype.pwmWrite = function (dutyCycle) {
  pigpio.gpioPWM(this.gpio, +dutyCycle);
  return this;
};
Gpio.prototype.analogWrite = Gpio.prototype.pwmWrite;

Gpio.prototype.hardwarePwmWrite = function (frequency, dutyCycle) {
  pigpio.gpioHardwarePWM(this.gpio, +frequency, +dutyCycle);
  return this;
};

Gpio.prototype.getPwmDutyCycle = function () {
  return pigpio.gpioGetPWMdutycycle(this.gpio);
};

Gpio.prototype.pwmRange = function (range) {
  pigpio.gpioSetPWMrange(this.gpio, +range);
  return this;
};

Gpio.prototype.getPwmRange = function () {
  return pigpio.gpioGetPWMrange(this.gpio);
};

Gpio.prototype.getPwmRealRange = function () {
  return pigpio.gpioGetPWMrealRange(this.gpio);
};

Gpio.prototype.pwmFrequency = function (frequency) {
  pigpio.gpioSetPWMfrequency(this.gpio, +frequency);
  return this;
};

Gpio.prototype.getPwmFrequency = function () {
  return pigpio.gpioGetPWMfrequency(this.gpio);
};

Gpio.prototype.servoWrite = function (pulseWidth) {
  pigpio.gpioServo(this.gpio, +pulseWidth);
  return this;
};

Gpio.prototype.getServoPulseWidth = function () {
  return pigpio.gpioGetServoPulsewidth(this.gpio);
};

Gpio.prototype.enableInterrupt = function (edge, timeout) {
  var handler = function (gpio, level, tick) {
    this.emit('interrupt', level);
  }.bind(this);

  timeout = timeout || 0;
  pigpio.gpioSetISRFunc(this.gpio, +edge, +timeout, handler);
  return this;
};

Gpio.prototype.disableInterrupt = function () {
  pigpio.gpioSetISRFunc(this.gpio, pigpio.EITHER_EDGE, 0);
  return this;
};

/*Gpio.terminate = function () {
  pigpio.gpioTerminate();
};*/

/* mode */
Gpio.INPUT = pigpio.PI_INPUT;
Gpio.OUTPUT = pigpio.PI_OUTPUT;
Gpio.ALT0 = pigpio.PI_ALT0;
Gpio.ALT1 = pigpio.PI_ALT1;
Gpio.ALT2 = pigpio.PI_ALT2;
Gpio.ALT3 = pigpio.PI_ALT3;
Gpio.ALT4 = pigpio.PI_ALT4;
Gpio.ALT5 = pigpio.PI_ALT5;

/* pud */
Gpio.PUD_OFF = pigpio.PI_PUD_OFF;
Gpio.PUD_DOWN = pigpio.PI_PUD_DOWN;
Gpio.PUD_UP = pigpio.PI_PUD_UP;

/* isr */
Gpio.RISING_EDGE = pigpio.RISING_EDGE;
Gpio.FALLING_EDGE = pigpio.FALLING_EDGE;
Gpio.EITHER_EDGE = pigpio.EITHER_EDGE;

/* timeout */
Gpio.TIMEOUT = pigpio.PI_TIMEOUT;

/* gpio numbers */
Gpio.MIN_GPIO = pigpio.PI_MIN_GPIO;
Gpio.MAX_GPIO = pigpio.PI_MAX_GPIO;
Gpio.MAX_USER_GPIO = pigpio.PI_MAX_USER_GPIO;

var NOTIFICATION_PIPE_PATH_PREFIX = '/dev/pigpio';

function Notifier(options) {
  if (!(this instanceof Notifier)) {
    return new Notifier(options);
  }

  initializePigpio();

  options = options || {};

  this.handle = pigpio.gpioNotifyOpenWithSize(1048576);

  this.notificationStream =
    fs.createReadStream(NOTIFICATION_PIPE_PATH_PREFIX + this.handle);

  if (typeof options.bits === 'number') {
    this.start(options.bits);
  }
}

module.exports.Notifier = Notifier;

Notifier.prototype.start = function (bits) {
  pigpio.gpioNotifyBegin(this.handle, +bits);
  return this;
};

Notifier.prototype.stop = function () {
  pigpio.gpioNotifyPause(this.handle);
  return this;
};

Notifier.prototype.close = function () {
  pigpio.gpioNotifyClose(this.handle);
};

Notifier.prototype.stream = function () {
  return this.notificationStream;
};

Notifier.NOTIFICATION_LENGTH = 12;

module.exports.configureClock = function (microseconds, peripheral) {
  pigpio.gpioCfgClock(+microseconds, +peripheral);
  initializePigpio();
};

module.exports.CLOCK_PWM = pigpio.PI_CLOCK_PWM;
module.exports.CLOCK_PCM = pigpio.PI_CLOCK_PCM;

