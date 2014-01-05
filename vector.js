"use strict";

var inspect = require('util').inspect

var prototypeProperties = {
  initialize: function (input) {
    if (arguments.length == 0) {
      input = []
    }
    if (arguments.length > 1) {
      input = [].slice.call(arguments);
    }
    if (input instanceof vector) {
      return input;
    }
    if (!Array.isArray(input)) {
      throw new Error("Cannot create vector from " + input);
    }
    this._ = Object.freeze(input.slice());
    this.length = input.length;
    for (var i = 0, len = input.length; i < len; i++) {
      this[i] = input[i];
    }
  },
  inspect: function () { return this._ ? inspect(this._) : '[]' }
}

Object.getOwnPropertyNames(Array.prototype)
  .forEach(function (name) {
    var fn = Array.prototype[name];
    if (typeof fn != 'function')
      return;
    switch(name) {
      case 'constructor':
        break;
      case 'pop':
      case 'push':
      case 'reverse':
      case 'shift':
      case 'sort':
      case 'splice':
      case 'unshift':
        prototypeProperties[name] = mutator(fn);
        break;
      case 'concat':
      case 'map':
      case 'slice':
      case 'filter':
        prototypeProperties[name] = builder(fn);
        break;
      default:
        prototypeProperties[name] = delegator(fn);
    }
  });


var vector = require('./object').extend(prototypeProperties)
module.exports = vector;


function mutator (fn) {
  return function () {
    var data = this._.slice();
    fn.apply(data, arguments);
    return vector(data);
  }
}

function builder (fn) {
  return function () {
    return vector(fn.apply(this._, arguments));
  }
}

function delegator (fn) {
  return function () {
    return fn.apply(this._, arguments);
  }
}
