# pure-objects

This library is an exploration of the question _"what if JavaScript had proper
support for immutable data?"_

Using immutable data can improve our understanding of programs, in particular, functions that only operate on immutable data can be assumed to be "pure", that is, the same inputs will always produce the same outputs. This is a valuable property in that it makes reasoning about the behaviour of such functions much simpler.

## Warning/Notes etc

While this library works, it's probably *extremely slow* and possibly
impractical. It's an experiment I wrote in Sept. 2013 that I haven't gone on
to use in any "real" projects, but I figure it might be of interest to other
people as well and it's doing no good just sitting in my projects folder. ;)

## `Object.freeze` and friends

ECMAScript 5 introduced the ability for developers to define _read-only properties_, which can not be modified using the assignment operator (`=`). In addition to the ability to define individual properties as read-only, it adds functions for _sealing_ objects, meaning that no new properties may be added. Finally, _freezing_ and object both seals it and redefines all of it's properties as read-only, making the object itself immutable.

Unfortunately, in the name of backwards compatibility, the API's for performing these actions are somewhat… verbose. For example to define a read-only property on an object looks like this:

```
var obj = {};
Object.defineProperty(obj, "myProperty", {
  value: "my value",
  writable: false,
  configurable: false
})
```

Thankfully, freezing an object (which is what we want to do anyways) is much shorter:

```
Object.freeze(obj);
```

## Shortcomings of `Object.freeze`

There are some other practical issues with `Object.freeze` that make it awkward to use. To start with, it's _shallow_:

```
var obj = Object.freeze({subObject: {x: 1}})
Object.isFrozen(obj)           //=> true
Object.isFrozen(obj.subObject) //=> false
```

If `obj` has methods that depend on the data in `obj.subObject`, we can no longer rely on those methods being _pure_.

## API

### object.extend = function ([mixins], properties)

`object.extend` will create a new object using the base object as a prototype.
All values passed in `properties` are copied into the extended object by value
as non-writeable, non-configurable properties. Any unfrozen objects (according
to `Object.isFrozen`) given as property values **will be recursively-frozen**
This can be quite slow so make sure you're passing objects that are
shallow or already frozen.

The optional `mixins` param can be an array of properties objects that will be
used to extend `object` before extending it with properties. This is a syntactic
convenience and may be removed in later releases.
