"use strict";

var traverse = require('traverse')

module.exports = ImmutableObject;

function ImmutableObject (properties) {
  if (!(this instanceof ImmutableObject)) {
    return new ImmutableObject(properties);
  } else {
    for (var k in properties) {
      this[k] = frozenCopy(properties[k]);
    }
  }
  Object.freeze(this);
}

Object.defineProperties(ImmutableObject.prototype, {
  defineProperty: {
    value: function (name, propertyDescriptor) {
      Object.defineProperty(this, name, propertyDescriptor)
    }
  },
  defineProperties: {
    value: function (propertyDescriptors) {
      Object.defineProperties(this, propertyDescriptors)
    }
  },
  getOwnPropertyNames: {
    value: function () {
      return Object.getOwnPropertyNames(this);
    }
  },
  getOwnPropertyDescriptor: {
    value: function (name) {
      return Object.getOwnPropertyDescriptor(this, name);
    }
  },
  derive: {
    value: function () {
      var derivation = Object.create(this);
      iterateExtensions.apply(derivation, arguments);
      return Object.freeze(derivation);
    }
  }
});

Object.freeze(ImmutableObject.prototype);

ImmutableObject.extend = function extend() {
  var prototype = Object.create(this.prototype, {
    constructor: {
      value: constructor,
      enumerable: false
    }
  });

  var initializers = iterateExtensions.apply(prototype, arguments);

  Object.freeze(prototype);

  constructor.extend    = extend;
  constructor.prototype = prototype;
  constructor.parent    = this;

  return Object.freeze(constructor);

  function constructor () {
    var instance;
    if (this instanceof constructor && !Object.isFrozen(this)) {
      // `new` was used to create this object
      instance = this;
    } else {
      // constructor was called as a normal function
      instance = Object.create(prototype);
    }
    var lastInitializer = initializers.length - 1;
    for (var i = 0; i <= lastInitializer; i++) {
      initializers[i].apply(instance, arguments)
    }
    var ownPropertyNames = instance.getOwnPropertyNames();
    for (var j = 0, end = ownPropertyNames.length; j < end; j++) {
      var name = ownPropertyNames[j];
      if (typeof instance[name] != 'object') {
        continue;
      }
      if (instance.getOwnPropertyDescriptor(name).writable) {
        instance[name] = frozenCopy(instance[name]);
      }
      else if (!Object.isFrozen(instance[name]) && console && console.error) {
        var err = new Error(
          "WARNING: non-writable property " + name + " is not frozen!"
        );
        console.error(err)
      }
    }
    return Object.freeze(instance);
  }
}

Object.freeze(ImmutableObject);
Object.freeze(ImmutableObject.extend);

/**
 * Handle arguments to `extend` and `derive`.
 *
 * In the case of `extend`, `this` should be an object prototype.
 * In the case of `derive`, `this` will be a new object instance.
 *
 * Arguments of different types have different effects
 *  - Functions will be called: `f.call(this)`
 *  - Objects will be mixed-in: `copyProperties(self, obj)`
 *  - Arrays will be treated as a nested list of arguments.
 *  - Primitives will be ignored.
 */
function iterateExtensions() {
  var target       = this;
  var initializers = [];

  for (var a = 0, end = arguments.length; a < end; a++) {
    extendOrInitializeWith(arguments[a]);
  }

  return initializers;

  function extendOrInitializeWith (item) {
    if (Array.isArray(item)) {
      initializers.concat(iterateExtensions.apply(target, item));
      return;
    }

    switch (typeof item) {
      case 'function':
        item.call(target);
        break;
      case 'object':
        copyProperties(target, item);
        if (typeof item.extend == 'function') {
          item.extend.call(target);
        }
        if (typeof item.initialize == 'function') {
          initializers.push(item.initialize);
        }
        break;
      default:
        // Do nothing with primitives
    }
  }
}

function copyProperties(object, properties) {
  for (var k in properties) {
    if (k == 'extend' || k == 'initialize') {
      continue;
    }
    var value = properties[k];
    var type = typeof value;
    if (type == 'object' || type == 'function') {
      if (!Object.isFrozen(value)) {
        value = frozenCopy(value);
      }
    }
    Object.defineProperty(object, k, {
      value: value,
      writable: true,
      enumerable: true
    });
  }
}

function frozenCopy(o) {
  if (typeof o != 'object' || o instanceof ImmutableObject) {
    return o;
  }
  if (o instanceof Date) {
    return Object.freeze(new Date(o.toString()));
  }
  if (o instanceof RegExp) {
  }
  var copy = Array.isArray(o) ? [] : {}
  for (var k in o) copy[k] = frozenCopy(o[k]);
  return Object.freeze(copy);
}
