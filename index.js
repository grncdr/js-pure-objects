"use strict";

var traverse = require('traverse')

module.exports = extend.call({extend: extend});

var metaPropertyPattern = /^__pure_/;

function extend() {
  var proto = this;
  var mixins = [].slice.call(arguments);
  var properties = mixins.pop() || {};
  mixins = flatten(mixins);

  if (mixins) mixins.forEach(function (mixin) {
    proto = proto.extend(mixin);
  });

  var propertyDescriptors = {};
  for (var k in properties) {
    if (metaPropertyPattern.test(k)) {
      console.error("Meta properties not implemented yet");
      continue;
    }

    var value = properties[k];

    if (k == 'initialize' || k == 'extend') {
      continue;
    }

    var type = typeof value;
    if (type == 'object' || type == 'function') {
      value = freezeRecursive(value);
    }

    propertyDescriptors[k] = {
      value: value,
      configurable: false,
      enumerable: true,
      writable: false
    };
  }

  var base = Object.create(proto, propertyDescriptors);

  var initialize = properties.initialize;
  
  if (properties.extend) {
    base.set = setProperty;
    properties.extend.call(base);
    delete base.set;
  }

  Object.freeze(base);

  if (typeof initialize != 'function') initialize = function(){};

  function make () {
    var instance = Object.create(base, {});
    instance.set = setProperty;
    initialize.apply(instance, arguments);
    delete instance.set;
    return Object.freeze(instance);
  }

  make.__proto__ = base;

  return Object.freeze(make);
}

function setProperty(key, value, enumerable, noFreeze) {
  if (!noFreeze && typeof value == 'object' && !Object.isFrozen(value)) {
    value = Object.freeze(value);
  }
  
  enumerable = typeof enumerable != 'undefined' ? enumerable : false;

  Object.defineProperty(this, key, {
    value: value,
    enumerable: enumerable,
    writable: false,
    configurable: false
  })
}

function freezeRecursive(object) {
  return traverse(object).map(function () {
    if (typeof this.node == 'object') {
      if (this.circular) return;
      if (this.isRoot) Object.freeze(this.node);
      else Object.freeze(this.parent.node[this.key])
    }
  })
}

function flatten(array) {
  return array.reduce(function (a, o) {
    if (Array.isArray(o)) {
      return a.concat(flatten(o));
    } else {
      a.push(o);
      return a;
    }
  }, []);
}
