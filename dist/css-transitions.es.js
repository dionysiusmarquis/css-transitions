import parse from 'parse-duration';
import prefix from 'prefix-style';

function camelize (str) {
  return str.replace(/[_.-](\w|$)/g, (_, x) => {
    return x.toUpperCase()
  })
}
function dasherize (str) {
  return str.trim().replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase()
}
function vendor (property, dashes = false) {
  property = prefix(camelize(property));
  return dashes ? dasherize(property) : property
}

class Values {
  constructor (polyfilled, start, end, finish) {
    this.polyfilled = polyfilled;
    this.start = start;
    this.end = end;
    this.finish = finish;
  }
}
function auto (element, computed, property, resolved) {
  let start = computed[property];
  let currentValue = element.style[property];
  element.style[property] = resolved.end;
  let end = getComputedStyle(element)[property];
  element.style[property] = currentValue;
  if (end !== resolved.end || start !== currentValue) {
    return new Values(true, start, end, resolved.end)
  }
  return resolved
}

class Listener {
  constructor (property, callback = null, timeout = null) {
    this._property = property;
    this._vendorProperty = vendor(property);
    this._callback = callback;
    this._timeout = timeout;
  }
  destroy () {
    clearTimeout(this._timeout);
    this._property = null;
    this._vendorProperty = null;
    this._callback = null;
    this._timeout = null;
  }
  get property () { return this._property }
  get vendorProperty () { return this._vendorProperty }
  get callback () { return this._callback }
  get timeout () { return this._timeout }
}

class ListenElement {
  constructor (element, callback = null) {
    this._element = element;
    this._callback = callback;
    this._listeners = {};
    this._boundTransitionEndHandler = event => this._transitionEndHandler(event);
    this._boundAnimationEndHandler = event => this._animationEndHandler(event);
    this._addListeners();
  }
  _addListeners () {
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
  }
  _transitionEndHandler (event) {
    if (event.target !== this._element) {
      return
    }
    let listeners = this.get(event.propertyName);
    if (listeners) {
      listeners.forEach(listener => listener._callback(this, listener, event));
    }
    this._callbackAll(event);
  }
  _animationEndHandler (event) {
    this._callbackAll(event);
  }
  _callbackAll (event) {
    if (this._callback) {
      this._callback(this, event);
    }
    if (this._listeners && this._listeners['all']) {
      this._listeners['all'].forEach(listener => listener._callback(this, listener, event));
    }
  }
  add (listen, callback) {
    if (!listen || listen === 'all') {
      this.addListener('all', callback, true);
    } else if (typeof listen === 'string') {
      this.addListener(listen, callback);
    } else if (listen instanceof Array) {
      listen.forEach(property => { this.addListener(property, callback); });
    } else {
      throw new Error('\'listen\' must be a string or an array.')
    }
  }
  addListener (property, callback, force = false) {
    let vendorProperty = !force ? vendor(property) : property;
    if (force || vendorProperty) {
      this.remove(property, callback);
      if (!this._listeners[vendorProperty]) {
        this._listeners[vendorProperty] = new Map();
      }
      this._listeners[vendorProperty].set(callback, new Listener(property, callback));
    } else {
      console.warn(`Property '${property}' not supported.`);
    }
  }
  remove (listen, callback = null, destroy = false) {
    if (!this._listeners) {
      return
    }
    if (!listen || listen === 'all') {
      listen = ['all'];
    } else if (typeof listen === 'string') {
      listen = [listen];
    }
    listen.forEach(
      property => {
        console.log(property);
        property = property === 'all' ? property : vendor(property);
        if (!callback) {
          delete this._listeners[property];
        } else {
          let listeners = this._listeners[property];
          if (listeners) {
            let listener = listeners.get(callback);
            if (listener) {
              listeners.delete(callback);
              if (destroy) {
                listener.destroy();
              }
            }
            if (!listeners.size) {
              delete this._listeners[property];
            }
          }
        }
      }
    );
  }
  get (property) {
    return this._listeners[property] || this._listeners[vendor(property)]
  }
  destroy (listeners = true) {
    if (listeners) {
      for (let listeners of Object.values(this._listeners)) {
        listeners.forEach(listener => listener.destroy());
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
  }
  get element () { return this._element }
  get callback () { return this._callback }
  get listeners () { return this._listeners }
}

class Transition extends Listener {
  constructor (property, value, duration = 0, easing = null, delay = 0, callback = null, clean = false, timeout = null) {
    super(property, callback, timeout);
    this._value = value;
    this._duration = duration;
    this._easing = easing;
    this._delay = delay;
    this._clean = clean;
    this._string = null;
    this.update();
  }
  update () {
    let duration = typeof this._duration === 'string' ? this._duration : (this._duration / 1000) + 's';
    let delay = this._delay ? typeof this._delay === 'string' ? this._delay : (this._delay / 1000) + 's' : null;
    this._string = `${vendor(this._vendorProperty, true)} ${duration}${this._easing ? ' ' + this._easing : ''}${this._delay ? ' ' + delay : ''}`;
  }
  destroy () {
    this._value = null;
    this._duration = null;
    this._easing = null;
    this._delay = null;
    this._string = null;
    super.destroy();
  }
  toString () {
    return this._string
  }
  get value () { return this._value }
  get duration () { return this._duration }
  get easing () { return this._easing }
  get delay () { return this._delay }
  get clean () { return this._clean }
  get string () { return this._string }
}

const failureGracePeriod = 100;
class TransitionElement extends ListenElement {
  constructor (element) {
    super(element);
    this._transitions = {};
    this._pendingTransitions = {};
  }
  _transitionEndHandler (event) {
    if (event.target !== this._element) {
      return
    }
    let transition = this.get(event.propertyName);
    if (transition) {
      this._executeCallback(transition, event);
      this.removeTransition(transition);
    }
  }
  _executeCallback (transition, event = null) {
    if (transition._callback) {
      transition._callback(this, transition, event);
    }
  }
  _removePolyfill (transition, value, event, callback) {
    this._element.style[transition._vendorProperty] = value;
    transition._callback = callback;
    this._executeCallback(transition, event);
  }
  _applyPolyfills (polyfills, computed, property, value, resolved = null) {
    resolved = resolved || new Values(false, null, value, value);
    if (polyfills) {
      for (let polyfill of polyfills) {
        let values = polyfill(this._element, computed, property, resolved);
        if (values.polyfilled) {
          resolved = values;
        }
      }
    }
    return resolved
  }
  update () {
    this._element.style[vendor('transition')] = Object.values(this._transitions).map(transition => transition.string).join(',');
  }
  add (properties, duration, options = {}) {
    let transitions = {};
    let computed = {};
    let computedStyles = getComputedStyle(this._element);
    for (let i = 0; i < computedStyles.length; i++) {
      let cssProperty = computedStyles[i];
      computed[camelize(cssProperty)] = computedStyles.getPropertyValue(cssProperty);
    }
    for (let [property, value] of Object.entries(properties)) {
      let vendorProperty = vendor(property);
      if (vendorProperty) {
        this.remove(vendorProperty);
        value = value === null ? '' : value;
        if (options.px) {
          value = !isNaN(parseFloat(value)) ? `${value}px` : value;
        }
        let parsedDuration = typeof duration === 'string' ? parse(duration) : duration;
        let parsedDelay = options.delay ? typeof options.delay === 'string' ? parse(options.delay) : options.delay : 0;
        let resolved = null;
        if (options.auto !== false) {
          resolved = this._applyPolyfills([auto], computed, vendorProperty, value);
        }
        let {polyfilled, start, end, finish} = this._applyPolyfills(
          options.polyfill ? [options.polyfill] : options.polyfills,
          computed,
          vendorProperty,
          value,
          resolved
        );
        let transition = transitions[vendorProperty] = this._pendingTransitions[vendorProperty] =
          new Transition(
            property,
            end,
            parsedDuration,
            options.easing,
            parsedDelay,
            polyfilled
              ? (_, transition, event) => this._removePolyfill(transition, finish, event, options.callback)
              : options.callback
            ,
            options.clean,
            null
          );
        if (start) {
          this._element.style[vendorProperty] = start;
        }
        if (options.fallback !== false) {
          transition._timeout = setTimeout(() => {
            if (transition._callback) {
              this._executeCallback(transition);
            }
            this.removeTransition(transition);
          }, parsedDelay + parsedDuration + failureGracePeriod);
        }
      } else {
        console.warn(`Property '${property}' not supported.`);
      }
    }
    setTimeout(() => {
      for (let [property, transition] of Object.entries(transitions)) {
        delete this._pendingTransitions[property];
        this._transitions[property] = transition;
      }
      this.update();
      for (let [property, transition] of Object.entries(transitions)) {
        if (property) {
          this._element.style[property] = transition._value;
        }
      }
    }, options.timeout || 15);
  }
  remove (property, destroy = false) {
    this.removeTransition(this.get(property), destroy);
  }
  removeTransition (transition, destroy = false) {
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
      if (transition._clean) {
        this._element.style[transition._property] = '';
      }
      if (destroy) {
        transition.destroy();
      } else {
        clearTimeout(transition._timeout);
      }
    }
    this.update();
  }
  stop (property) {
    this.remove(property);
  }
  get (property) {
    return this._transitions[property] ||
      this._transitions[vendor(property)] ||
      this._pendingTransitions[property] ||
      this._pendingTransitions[vendor(property)]
  }
  destroy (transitions = true) {
    if (transitions) {
      for (let transition of Object.values(this._transitions)) {
        transition.destroy();
      }
    }
    this._transitions = null;
    this._pendingTransitions = null;
    super.destroy(transitions);
  }
  get transitions () { return Object.assign({}, this._transitions, this._pendingTransitions) }
}

const transitionElements = new Map();
function transition$1 (element, properties, duration, options = {}) {
  let promise = new Promise(
    resolve => {
      let transitionElement = transitionElements.get(element);
      if (!transitionElement) {
        transitionElement = new TransitionElement(element);
        transitionElements.set(element, transitionElement);
      }
      let events = {};
      let transitions = {};
      let resolved = new Set();
      let propertyKeys = Object.keys(properties);
      let defaultOptions = {
        callback:
          (element, transition, event) => {
            let property = transition._property;
            events[property] = event;
            transitions[property] = transition;
            resolved.add(property);
            let unresolved = propertyKeys.filter(property => !resolved.has(property));
            if (!unresolved.length) {
              resolve({element, transitions, events});
            }
            removeTransition(element._element, transition._vendorProperty);
          }
      };
      let transitionOptions = Object.assign({}, defaultOptions, options);
      transitionElement.add(properties, duration, transitionOptions);
    }
  );
  if (options.callback) {
    promise.then(data => options.callback(data.element, data.transition, data.event));
  }
  return promise
}
function removeTransition (element, property) {
  let transitionElement = getTransitionElement(element);
  if (transitionElement) {
    transitionElement.remove(property);
    if (!Object.keys(transitionElement._transitions).length) {
      transitionElements.delete(element);
      transitionElement.destroy();
    }
  }
}
function removeTransitions (element) {
  let transitionElement = getTransitionElement(element);
  if (transitionElement) {
    transitionElements.delete(element);
    transitionElement.destroy();
  }
}
function getTransitionElement (element) {
  return transitionElements.get(element)
}
function getTransition (element, property) {
  let transitionElement = transitionElements.get(element);
  if (transitionElement) {
    return transitionElement.get(property)
  }
}
function hasTransition (element, property) {
  return !(!getTransition(element, property))
}

const listenElements = new Map();
function listen (element, listen = null, callback = null) {
  let all = !listen || listen === 'all';
  if (all && !callback) {
    throw new Error('Listener required if \'all\' properties are listened.')
  }
  let listenElement = listenElements.get(element);
  if (!listenElement) {
    listenElement = new ListenElement(element);
    listenElements.set(element, listenElement);
  }
  let events = {};
  let listeners = {};
  let resolved = new Set();
  let listenProperties = listen instanceof Array ? listen.map(property => vendor(property)) : [vendor(listen)];
  let promise = new Promise(
    resolve => {
      if (!all) {
        let resolveCallback = (element, listener, event) => {
          let property = listener._property;
          events[property] = event;
          listeners[property] = listener;
          resolved.add(vendor(property));
          console.log(resolved, listenProperties);
          let unresolved = listenProperties.filter(property => !resolved.has(property));
          if (!unresolved.length) {
            resolve({element, listeners, events});
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
  let listenElement = listenElements.get(element);
  if (listenElement) {
    listenElement.remove(listen, listener);
    if (!Object.keys(listenElement._listeners).length) {
      console.log(listenElements);
      listenElements.delete(element);
      listenElement.destroy();
      console.log(listenElements);
    }
  }
}
function getListenerElement (element) {
  return listenElements.get(element)
}
function getListener (element, property) {
  let listenElement = listenElements.get(element);
  if (listenElement) {
    return listenElement.get(property)
  }
}
function hasListener (element, property, listener) {
  let listeners = getListener(element, property);
  if (listener) {
    return listeners.indexOf(listener) !== -1
  } else {
    return false
  }
}

export { listen, removeTransition as remove, removeTransition, removeTransitions, removeTransitions as stop, removeTransition as stopTransition, removeTransitions as stopTransitions, getTransitionElement as getElement, getTransitionElement, getTransition as get, getTransition, hasTransition as has, hasTransition, TransitionElement, Transition, vendor, removeListener, getListenerElement, getListener, getListener as getListeners, hasListener, ListenElement, Listener };export default transition$1;
