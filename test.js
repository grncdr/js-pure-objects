var test = require('tape')
var pure = require('./');

test("all stuff", function (t) {
  "use strict";

  function assertFrozen(it, msg) {
    t.ok(Object.isFrozen(it), msg)
  }

  var d = pure.object.extend({
    x: {
      y: {
        z: ['a', 'b', 'c']
      }
    }
  });

  t.equal(typeof d, 'function',
      '.extend returns a function');
  assertFrozen(d,
      ".extend returns frozen function");
  assertFrozen(d.prototype,
      ".extend returns function with frozen prototype");
  assertFrozen(d.prototype.x,
      "prototype properties are frozen");
  assertFrozen(d.prototype.x.y.z,
      "prototype properties are recursively frozen");

  /*
  t.throws(function () {
    tagged.prototype.tags._[0] = 'blahblah';
  }, 'internal data is also frozen')
  */

  var p = pure.object.extend({
    initialize: function (x) {
      this.defineProperty('x', {value: x});
    }
  });

  t.equal(p(1).x, 1);

  var derived = p(1).derive({x: 2});

  t.equal(derived.x, 2);
  t.ok(derived instanceof p);


  var tagged = pure.object.extend(
    {
      tags: pure.vector(),
      tag: function (name) {
        this.tags = this.tags.push(name);
      },
      isA: function (name) {
        return this.tags.indexOf(name) >= 0;
      }
    },
    // functions will be called during prototype creation
    function () { this.tag('firstMixin') },
    function () { this.tag('secondMixin') }
  )

  t.ok(tagged.prototype.isA('firstMixin'))
  t.ok(tagged.prototype.isA('secondMixin'))

  t.end()
})
