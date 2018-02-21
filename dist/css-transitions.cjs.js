'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var parse = _interopDefault(require('parse-duration'));
var prefix = _interopDefault(require('prefix-style'));

function camelize (str) {
  return str.replace(/[_.-](\w|$)/g, function (_, x) {
    return x.toUpperCase()
  })
}
function dasherize (str) {
  return str.trim().replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase()
}
function vendor (property, dashes) {
  if ( dashes === void 0 ) dashes = false;

  property = prefix(camelize(property));
  return dashes ? dasherize(property) : property
}

var Values = function Values (polyfilled, start, end, finish) {
  this.polyfilled = polyfilled;
  this.start = start;
  this.end = end;
  this.finish = finish;
};
function auto (element, computed, property, resolved) {
  var start = computed[property];
  var currentValue = element.style[property];
  element.style[property] = resolved.end;
  var end = getComputedStyle(element)[property];
  element.style[property] = currentValue;
  if (end !== resolved.end || start !== currentValue) {
    return new Values(true, start, end, resolved.end)
  }
  return resolved
}

var Listener = function Listener (property, callback, timeout) {
  if ( callback === void 0 ) callback = null;
  if ( timeout === void 0 ) timeout = null;

  this._property = property;
  this._vendorProperty = vendor(property);
  this._callback = callback;
  this._timeout = timeout;
};

var prototypeAccessors$1 = { property: {},vendorProperty: {},callback: {},timeout: {} };
Listener.prototype.destroy = function destroy () {
  clearTimeout(this._timeout);
  this._property = null;
  this._vendorProperty = null;
  this._callback = null;
  this._timeout = null;
};
prototypeAccessors$1.property.get = function () { return this._property };
prototypeAccessors$1.vendorProperty.get = function () { return this._vendorProperty };
prototypeAccessors$1.callback.get = function () { return this._callback };
prototypeAccessors$1.timeout.get = function () { return this._timeout };

Object.defineProperties( Listener.prototype, prototypeAccessors$1 );

var ListenElement = function ListenElement (element, callback) {
  var this$1 = this;
  if ( callback === void 0 ) callback = null;

  this._element = element;
  this._callback = callback;
  this._listeners = {};
  this._boundTransitionEndHandler = function (event) { return this$1._transitionEndHandler(event); };
  this._boundAnimationEndHandler = function (event) { return this$1._animationEndHandler(event); };
  this._addListeners();
};

var prototypeAccessors = { element: {},callback: {},listeners: {} };
ListenElement.prototype._addListeners = function _addListeners () {
  if (typeof document.body.style['transition'] !== 'undefined') {
    this._element.addEventListener('transitionend', this._boundTransitionEndHandler);
    this._element.addEventListener('animationend', this._boundAnimationEndHandler);
  } else if (typeof document.body.style['WebkitTransition'] !== 'undefined') {
    this._element.addEventListener('webkitTransitionEnd', this._boundTransitionEndHandler);
    this._element.addEventListener('webkitAnimationEnd', this._boundAnimationEndHandler);
  } else if (typeof document.body.style['MozTransition'] !== 'undefined') {
    this._element.addEventListener('transitionend', this._boundTransitionEndHandler);
    this._element.addEventListener('animationend', this._boundAnimationEndHandler);
  } else if (typeof document.body.style['OTransition'] !== 'undefined') {
    this._element.addEventListener('oTransitionEnd', this._boundTransitionEndHandler);
    this._element.addEventListener('oAnimationEnd', this._boundAnimationEndHandler);
  }
};
ListenElement.prototype._transitionEndHandler = function _transitionEndHandler (event) {
    var this$1 = this;

  if (event.target !== this._element) {
    return
  }
  var listeners = this.get(event.propertyName);
  if (listeners) {
    listeners.forEach(function (listener) { return listener._callback(this$1, listener, event); });
  }
  this._callbackAll(event);
};
ListenElement.prototype._animationEndHandler = function _animationEndHandler (event) {
  this._callbackAll(event);
};
ListenElement.prototype._callbackAll = function _callbackAll (event) {
    var this$1 = this;

  if (this._callback) {
    this._callback(this, event);
  }
  if (this._listeners && this._listeners['all']) {
    this._listeners['all'].forEach(function (listener) { return listener._callback(this$1, listener, event); });
  }
};
ListenElement.prototype.add = function add (listen, callback) {
    var this$1 = this;

  if (!listen || listen === 'all') {
    this.addListener('all', callback, true);
  } else if (typeof listen === 'string') {
    this.addListener(listen, callback);
  } else if (listen instanceof Array) {
    listen.forEach(function (property) { this$1.addListener(property, callback); });
  } else {
    throw new Error('\'listen\' must be a string or an array.')
  }
};
ListenElement.prototype.addListener = function addListener (property, callback, force) {
    if ( force === void 0 ) force = false;

  var vendorProperty = !force ? vendor(property) : property;
  if (force || vendorProperty) {
    this.remove(property, callback);
    if (!this._listeners[vendorProperty]) {
      this._listeners[vendorProperty] = new Map();
    }
    this._listeners[vendorProperty].set(callback, new Listener(property, callback));
  } else {
    console.warn(("Property '" + property + "' not supported."));
  }
};
ListenElement.prototype.remove = function remove (listen, callback, destroy) {
    var this$1 = this;
    if ( callback === void 0 ) callback = null;
    if ( destroy === void 0 ) destroy = false;

  if (!this._listeners) {
    return
  }
  if (!listen || listen === 'all') {
    listen = ['all'];
  } else if (typeof listen === 'string') {
    listen = [listen];
  }
  listen.forEach(
    function (property) {
      property = property === 'all' ? property : vendor(property);
      if (!callback) {
        delete this$1._listeners[property];
      } else {
        var listeners = this$1._listeners[property];
        if (listeners) {
          var listener = listeners.get(callback);
          if (listener) {
            listeners.delete(callback);
            if (destroy) {
              listener.destroy();
            }
          }
          if (!listeners.size) {
            delete this$1._listeners[property];
          }
        }
      }
    }
  );
};
ListenElement.prototype.get = function get (property) {
  return this._listeners[property] || this._listeners[vendor(property)]
};
ListenElement.prototype.destroy = function destroy (listeners) {
    var this$1 = this;
    if ( listeners === void 0 ) listeners = true;

  if (listeners) {
    for (var listeners$1 of Object.values(this$1._listeners)) {
      listeners$1.forEach(function (listener) { return listener.destroy(); });
    }
  }
  this._element.removeEventListener('transitionend', this._boundTransitionEndHandler);
  this._element.removeEventListener('animationend', this._boundAnimationEndHandler);
  this._element.removeEventListener('webkitTransitionEnd', this._boundTransitionEndHandler);
  this._element.removeEventListener('webkitAnimationEnd', this._boundAnimationEndHandler);
  this._element.removeEventListener('transitionend', this._boundTransitionEndHandler);
  this._element.removeEventListener('animationend', this._boundAnimationEndHandler);
  this._element.removeEventListener('oTransitionEnd', this._boundTransitionEndHandler);
  this._element.removeEventListener('oAnimationEnd', this._boundAnimationEndHandler);
  this._element = null;
  this._callback = null;
  this._listeners = null;
};
prototypeAccessors.element.get = function () { return this._element };
prototypeAccessors.callback.get = function () { return this._callback };
prototypeAccessors.listeners.get = function () { return this._listeners };

Object.defineProperties( ListenElement.prototype, prototypeAccessors );

var Transition = (function (Listener$$1) {
  function Transition (property, value, duration, easing, delay, callback, timeout) {
    if ( duration === void 0 ) duration = 0;
    if ( easing === void 0 ) easing = null;
    if ( delay === void 0 ) delay = 0;
    if ( callback === void 0 ) callback = null;
    if ( timeout === void 0 ) timeout = null;

    Listener$$1.call(this, property, callback, timeout);
    this._value = value;
    this._duration = duration;
    this._easing = easing;
    this._delay = delay;
    this._string = null;
    this.update();
  }

  if ( Listener$$1 ) Transition.__proto__ = Listener$$1;
  Transition.prototype = Object.create( Listener$$1 && Listener$$1.prototype );
  Transition.prototype.constructor = Transition;

  var prototypeAccessors = { value: {},duration: {},easing: {},delay: {},string: {} };
  Transition.prototype.update = function update () {
    var duration = typeof this._duration === 'string' ? this._duration : (this._duration / 1000) + 's';
    var delay = this._delay ? typeof this._delay === 'string' ? this._delay : (this._delay / 1000) + 's' : null;
    this._string = (vendor(this._vendorProperty, true)) + " " + duration + (this._easing ? ' ' + this._easing : '') + (this._delay ? ' ' + delay : '');
  };
  Transition.prototype.destroy = function destroy () {
    this._value = null;
    this._duration = null;
    this._easing = null;
    this._delay = null;
    this._string = null;
    Listener$$1.prototype.destroy.call(this);
  };
  Transition.prototype.toString = function toString () {
    return this._string
  };
  prototypeAccessors.value.get = function () { return this._value };
  prototypeAccessors.duration.get = function () { return this._duration };
  prototypeAccessors.easing.get = function () { return this._easing };
  prototypeAccessors.delay.get = function () { return this._delay };
  prototypeAccessors.string.get = function () { return this._string };

  Object.defineProperties( Transition.prototype, prototypeAccessors );

  return Transition;
}(Listener));

var failureGracePeriod = 100;
var TransitionElement = (function (ListenElement$$1) {
  function TransitionElement (element) {
    ListenElement$$1.call(this, element);
    this._transitions = {};
    this._pendingTransitions = {};
  }

  if ( ListenElement$$1 ) TransitionElement.__proto__ = ListenElement$$1;
  TransitionElement.prototype = Object.create( ListenElement$$1 && ListenElement$$1.prototype );
  TransitionElement.prototype.constructor = TransitionElement;

  var prototypeAccessors = { transitions: {} };
  TransitionElement.prototype._transitionEndHandler = function _transitionEndHandler (event) {
    if (event.target !== this._element) {
      return
    }
    var transition = this.get(event.propertyName);
    if (transition) {
      this._executeCallback(transition, event);
      this.removeTransition(transition);
    }
  };
  TransitionElement.prototype._executeCallback = function _executeCallback (transition, event) {
    if ( event === void 0 ) event = null;

    if (transition._callback) {
      transition._callback(this, transition, event);
    }
  };
  TransitionElement.prototype._removePolyfill = function _removePolyfill (transition, value, event, callback) {
    this._element.style[transition._vendorProperty] = value;
    transition._callback = callback;
    this._executeCallback(transition, event);
  };
  TransitionElement.prototype._applyPolyfills = function _applyPolyfills (polyfills, computed, property, value, resolved) {
    var this$1 = this;
    if ( resolved === void 0 ) resolved = null;

    resolved = resolved || new Values(false, null, value, value);
    if (polyfills) {
      for (var [, polyfill] of polyfills.entries()) {
        var values = polyfill(this$1._element, computed, property, resolved);
        if (values.polyfilled) {
          resolved = values;
        }
      }
    }
    return resolved
  };
  TransitionElement.prototype.update = function update () {
    this._element.style[vendor('transition')] = Object.values(this._transitions).map(function (transition) { return transition.string; }).join(',');
  };
  TransitionElement.prototype.add = function add (properties, duration, options) {
    var this$1 = this;
    if ( options === void 0 ) options = {};

    var transitions = {};
    var computed = {};
    var computedStyles = getComputedStyle(this._element);
    for (var i = 0; i < computedStyles.length; i++) {
      var cssProperty = computedStyles[i];
      computed[camelize(cssProperty)] = computedStyles.getPropertyValue(cssProperty);
    }
    for (var [property, value] of Object.entries(properties)) {
      var vendorProperty = vendor(property);
      if (vendorProperty) {
        this$1.remove(vendorProperty);
        if (options.px) {
          value = !isNaN(parseFloat(value)) ? (value + "px") : value;
        }
        var parsedDuration = typeof duration === 'string' ? parse(duration) : duration;
        var parsedDelay = options.delay ? typeof options.delay === 'string' ? parse(options.delay) : options.delay : 0;
        var resolved = null;
        if (options.auto !== false) {
          resolved = this$1._applyPolyfills([auto], computed, vendorProperty, value);
        }
        var ref = this$1._applyPolyfills(
          options.polyfill ? [options.polyfill] : options.polyfills,
          computed,
          vendorProperty,
          value,
          resolved
        );
        var polyfilled = ref.polyfilled;
        var start = ref.start;
        var end = ref.end;
        var finish = ref.finish;
        var transition = transitions[vendorProperty] = this$1._pendingTransitions[vendorProperty] =
          new Transition(
            property,
            end,
            parsedDuration,
            options.easing,
            parsedDelay,
            polyfilled
              ? function (_, transition, event) { return this$1._removePolyfill(transition, finish, event, options.callback); }
              : options.callback
            ,
            null
          );
        if (start) {
          this$1._element.style[vendorProperty] = start;
        }
        if (options.fallback !== false) {
          transition._timeout = setTimeout(function () {
            if (transition._callback) {
              this$1._executeCallback(transition);
            }
            this$1.removeTransition(transition);
          }, parsedDelay + parsedDuration + failureGracePeriod);
        }
      } else {
        console.warn(("Property '" + property + "' not supported."));
      }
    }
    setTimeout(function () {
      for (var [property, transition] of Object.entries(transitions)) {
        delete this$1._pendingTransitions[property];
        this$1._transitions[property] = transition;
      }
      this$1.update();
      for (var [property$1, transition$1] of Object.entries(transitions)) {
        if (property$1) {
          this$1._element.style[property$1] = transition$1._value;
        }
      }
    }, options.timeout || 15);
  };
  TransitionElement.prototype.remove = function remove (property, destroy) {
    if ( destroy === void 0 ) destroy = false;

    this.removeTransition(this.get(property), destroy);
  };
  TransitionElement.prototype.removeTransition = function removeTransition (transition, destroy) {
    if ( destroy === void 0 ) destroy = false;

    if (!this._transitions) {
      return
    }
    if (transition) {
      if (this._transitions[transition._vendorProperty]) {
        delete this._transitions[transition._vendorProperty];
      }
      if (this._pendingTransitions[transition._vendorProperty]) {
        delete this._pendingTransitions[transition._vendorProperty];
      }
      if (destroy) {
        transition.destroy();
      } else {
        clearTimeout(transition._timeout);
      }
    }
    this.update();
  };
  TransitionElement.prototype.stop = function stop (property) {
    this.remove(property);
  };
  TransitionElement.prototype.get = function get (property) {
    return this._transitions[property] ||
      this._transitions[vendor(property)] ||
      this._pendingTransitions[property] ||
      this._pendingTransitions[vendor(property)]
  };
  TransitionElement.prototype.destroy = function destroy (transitions) {
    var this$1 = this;
    if ( transitions === void 0 ) transitions = true;

    if (transitions) {
      for (var transition of Object.values(this$1._transitions)) {
        transition.destroy();
      }
    }
    this._transitions = null;
    this._pendingTransitions = null;
    ListenElement$$1.prototype.destroy.call(this, transitions);
  };
  prototypeAccessors.transitions.get = function () { return Object.assign({}, this._transitions, this._pendingTransitions) };

  Object.defineProperties( TransitionElement.prototype, prototypeAccessors );

  return TransitionElement;
}(ListenElement));

var transitionElements = new Map();
function transition$1 (element, properties, duration, options) {
  if ( options === void 0 ) options = {};

  var promise = new Promise(
    function (resolve) {
      var transitionElement = transitionElements.get(element);
      if (!transitionElement) {
        transitionElement = new TransitionElement(element);
        transitionElements.set(element, transitionElement);
      }
      var events = {};
      var transitions = {};
      var resolved = new Set();
      var propertyKeys = Object.keys(properties);
      var defaultOptions = {
        callback:
          function (element, transition, event) {
            var property = transition._property;
            events[property] = event;
            transitions[property] = transition;
            resolved.add(property);
            var unresolved = propertyKeys.filter(function (property) { return !resolved.has(property); });
            if (!unresolved.length) {
              resolve({element: element, transitions: transitions, events: events});
            }
            removeTransition(element._element, transition._vendorProperty);
          }
      };
      var transitionOptions = Object.assign({}, defaultOptions, options);
      transitionElement.add(properties, duration, transitionOptions);
    }
  );
  if (options.callback) {
    promise.then(function (data) { return options.callback(data.element, data.transition, data.event); });
  }
  return promise
}
function removeTransition (element, property) {
  var transitionElement = getTransitionElement(element);
  if (transitionElement) {
    transitionElement.remove(property);
    if (!Object.keys(transitionElement._transitions).length) {
      transitionElements.delete(element);
      transitionElement.destroy();
    }
  }
}
function removeTransitions (element) {
  var transitionElement = getTransitionElement(element);
  if (transitionElement) {
    transitionElement.destroy();
  }
}
function getTransitionElement (element) {
  return transitionElements.get(element)
}
function getTransition (element, property) {
  var transitionElement = transitionElements.get(element);
  if (transitionElement) {
    return transitionElement.get(property)
  }
}
function hasTransition (element, property) {
  return !(!getTransition(element, property))
}

var listenElements = new Map();
function listen (element, listen, callback) {
  if ( listen === void 0 ) listen = null;
  if ( callback === void 0 ) callback = null;

  var all = !listen || listen === 'all';
  if (all && !callback) {
    throw new Error('Listener required if \'all\' properties are listened.')
  }
  var listenElement = listenElements.get(element);
  if (!listenElement) {
    listenElement = new ListenElement(element);
    listenElements.set(element, listenElement);
  }
  var events = {};
  var listeners = {};
  var resolved = new Set();
  var listenProperties = listen instanceof Array ? listen.map(function (property) { return vendor(property); }) : [vendor(listen)];
  var promise = new Promise(
    function (resolve) {
      if (!all) {
        var resolveCallback = function (element, listener, event) {
          var property = listener._property;
          events[property] = event;
          listeners[property] = listener;
          resolved.add(vendor(property));
          var unresolved = listenProperties.filter(function (property) { return !resolved.has(property); });
          if (!unresolved.length) {
            resolve({element: element, listeners: listeners, events: events});
            removeListener(element._element, listen, resolveCallback);
          }
        };
        listenElement.add(listen, resolveCallback);
      } else {
        resolve();
      }
    }
  );
  if (callback) {
    listenElement.add(listen, callback);
  }
  return promise
}
function removeListener (element, listen, listener) {
  var listenElement = listenElements.get(element);
  if (listenElement) {
    listenElement.remove(listen, listener);
    if (!Object.keys(listenElement._listeners).length) {
      listenElements.delete(element);
      listenElement.destroy();
    }
  }
}
function getListenerElement (element) {
  return listenElements.get(element)
}
function getListener (element, property) {
  var listenElement = listenElements.get(element);
  if (listenElement) {
    return listenElement.get(property)
  }
}
function hasListener (element, property, listener) {
  var listeners = getListener(element, property);
  if (listener) {
    return listeners.indexOf(listener) !== -1
  } else {
    return false
  }
}

exports['default'] = transition$1;
exports.listen = listen;
exports.remove = removeTransition;
exports.removeTransition = removeTransition;
exports.stop = removeTransitions;
exports.stopTransition = removeTransition;
exports.getElement = getTransitionElement;
exports.getTransitionElement = getTransitionElement;
exports.get = getTransition;
exports.getTransition = getTransition;
exports.has = hasTransition;
exports.hasTransition = hasTransition;
exports.TransitionElement = TransitionElement;
exports.Transition = Transition;
exports.vendor = vendor;
exports.removeListener = removeListener;
exports.getListenerElement = getListenerElement;
exports.getListener = getListener;
exports.getListeners = getListener;
exports.hasListener = hasListener;
exports.ListenElement = ListenElement;
exports.Listener = Listener;
