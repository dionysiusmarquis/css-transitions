import parse from 'parse-duration'

import vendor, {camelize} from './../utils/property'
import {auto, Values} from './../utils/polyfills'
import ListenElement from './listen-element'
import Transition from './transition'

const failureGracePeriod = 100

class TransitionElement extends ListenElement {
  constructor (element) {
    super(element)
    this._transitions = {}
    this._pendingTransitions = {}
  }

  _transitionEndHandler (event) {
    if (event.target !== this._element) {
      return
    }

    let transition = this.get(event.propertyName)

    if (transition) {
      this._executeCallback(transition, event)
      this.removeTransition(transition)
    }
  }

  _executeCallback (transition, event = null) {
    if (transition._callback) {
      transition._callback(this, transition, event)
    }
  }

  _removePolyfill (transition, value, event, callback) {
    this._element.style[transition._vendorProperty] = value
    transition._callback = callback
    this._executeCallback(transition, event)
  }

  _applyPolyfills (polyfills, computed, property, value, resolved = null) {
    resolved = resolved || new Values(false, null, value, value)

    if (polyfills) {
      for (let polyfill of polyfills) {
        let values = polyfill(this._element, computed, property, resolved)
        if (values.polyfilled) {
          resolved = values
        }
      }
    }

    return resolved
  }

  update () {
    this._element.style[vendor('transition')] = Object.values(this._transitions).map(transition => transition.string).join(',')
    // console.log(this._element.style[vendor('transition')])
  }

  add (properties, duration, options = {}) {
    let transitions = {}

    // save current styles state
    let computed = {}
    let computedStyles = getComputedStyle(this._element)
    for (let i = 0; i < computedStyles.length; i++) {
      let cssProperty = computedStyles[i]
      computed[camelize(cssProperty)] = computedStyles.getPropertyValue(cssProperty)
    }

    for (let [property, value] of Object.entries(properties)) {
      let vendorProperty = vendor(property)

      if (vendorProperty) {
        this.remove(vendorProperty)

        // prepare values
        if (options.px) {
          value = !isNaN(parseFloat(value)) ? `${value}px` : value
        }

        let parsedDuration = typeof duration === 'string' ? parse(duration) : duration
        let parsedDelay = options.delay ? typeof options.delay === 'string' ? parse(options.delay) : options.delay : 0

        // apply polyfills
        let resolved = null

        if (options.auto !== false) {
          resolved = this._applyPolyfills([auto], computed, vendorProperty, value)
        }

        let {polyfilled, start, end, finish} = this._applyPolyfills(
          options.polyfill ? [options.polyfill] : options.polyfills,
          computed,
          vendorProperty,
          value,
          resolved
        )

        // create transition
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
            null
          )

        // prepare element styles and properties
        if (start) {
          this._element.style[vendorProperty] = start
        }

        // event fallback
        if (options.fallback !== false) {
          transition._timeout = setTimeout(() => {
            if (transition._callback) {
              this._executeCallback(transition)
            }
            this.removeTransition(transition)
          }, parsedDelay + parsedDuration + failureGracePeriod)
        }
      } else {
        console.warn(`Property '${property}' not supported.`)
      }
    }

    // apply element styles
    setTimeout(() => {
      for (let [property, transition] of Object.entries(transitions)) {
        delete this._pendingTransitions[property]
        this._transitions[property] = transition
      }
      this.update()
      for (let [property, transition] of Object.entries(transitions)) {
        if (property) {
          this._element.style[property] = transition._value
        }
      }
    }, options.timeout || 15)
  }

  remove (property, destroy = false) {
    this.removeTransition(this.get(property), destroy)
  }

  removeTransition (transition, destroy = false) {
    if (!this._transitions) {
      return
    }

    if (transition) {
      if (this._transitions[transition._vendorProperty]) {
        delete this._transitions[transition._vendorProperty]
      }

      if (this._pendingTransitions[transition._vendorProperty]) {
        delete this._pendingTransitions[transition._vendorProperty]
      }

      if (destroy) {
        transition.destroy()
      } else {
        clearTimeout(transition._timeout)
      }
    }
    this.update()
  }

  stop (property) {
    this.remove(property)
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
        transition.destroy()
      }
    }

    this._transitions = null
    this._pendingTransitions = null

    super.destroy(transitions)
  }

  get transitions () { return Object.assign({}, this._transitions, this._pendingTransitions) }
}

export default TransitionElement
