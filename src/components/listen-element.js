import Listener from './listener'
import vendor from './../utils/property'

class ListenElement {
  constructor (element, callback = null) {
    this._element = element
    this._callback = callback
    this._listeners = {}

    this._boundTransitionEndHandler = event => this._transitionEndHandler(event)
    this._boundAnimationEndHandler = event => this._animationEndHandler(event)

    this._addListeners()
  }

  _addListeners () {
    if (typeof document.body.style['transition'] !== 'undefined') {
      this._element.addEventListener('transitionend', this._boundTransitionEndHandler)
      this._element.addEventListener('animationend', this._boundAnimationEndHandler)
    } else if (typeof document.body.style['WebkitTransition'] !== 'undefined') {
      this._element.addEventListener('webkitTransitionEnd', this._boundTransitionEndHandler)
      this._element.addEventListener('webkitAnimationEnd', this._boundAnimationEndHandler)
    } else if (typeof document.body.style['MozTransition'] !== 'undefined') {
      this._element.addEventListener('transitionend', this._boundTransitionEndHandler)
      this._element.addEventListener('animationend', this._boundAnimationEndHandler)
    } else if (typeof document.body.style['OTransition'] !== 'undefined') {
      this._element.addEventListener('oTransitionEnd', this._boundTransitionEndHandler)
      this._element.addEventListener('oAnimationEnd', this._boundAnimationEndHandler)
    }
  }

  _transitionEndHandler (event) {
    if (event.target !== this._element) {
      return
    }

    let listeners = this.get(event.propertyName)

    if (listeners) {
      listeners.forEach(listener => listener._callback(this, listener, event))
    }

    this._callbackAll(event)
  }

  _animationEndHandler (event) {
    this._callbackAll(event)
  }

  _callbackAll (event) {
    if (this._callback) {
      this._callback(this, event)
    }

    if (this._listeners && this._listeners['all']) {
      this._listeners['all'].forEach(listener => listener._callback(this, listener, event))
    }
  }

  add (listen, callback) {
    if (!listen || listen === 'all') {
      this.addListener('all', callback, true)
    } else if (typeof listen === 'string') {
      this.addListener(listen, callback)
    } else if (listen instanceof Array) {
      listen.forEach(property => { this.addListener(property, callback) })
    } else {
      throw new Error('\'listen\' must be a string or an array.')
    }
  }

  addListener (property, callback, force = false) {
    let vendorProperty = !force ? vendor(property) : property
    if (force || vendorProperty) {
      this.remove(property, callback)

      if (!this._listeners[vendorProperty]) {
        this._listeners[vendorProperty] = new Map()
      }

      this._listeners[vendorProperty].set(callback, new Listener(property, callback))
    } else {
      console.warn(`Property '${property}' not supported.`)
    }
  }

  remove (listen, callback = null, destroy = false) {
    if (!this._listeners) {
      return
    }

    if (!listen || listen === 'all') {
      listen = ['all']
    } else if (typeof listen === 'string') {
      listen = [listen]
    }

    listen.forEach(
      property => {
        console.log(property)
        property = property === 'all' ? property : vendor(property)
        if (!callback) {
          delete this._listeners[property]
        } else {
          let listeners = this._listeners[property]
          if (listeners) {
            let listener = listeners.get(callback)
            if (listener) {
              listeners.delete(callback)
              if (destroy) {
                listener.destroy()
              }
            }

            if (!listeners.size) {
              delete this._listeners[property]
            }
          }
        }
      }
    )
  }

  get (property) {
    return this._listeners[property] || this._listeners[vendor(property)]
  }

  destroy (listeners = true) {
    if (listeners) {
      for (let listeners of Object.values(this._listeners)) {
        listeners.forEach(listener => listener.destroy())
      }
    }

    this._element.removeEventListener('transitionend', this._boundTransitionEndHandler)
    this._element.removeEventListener('animationend', this._boundAnimationEndHandler)
    this._element.removeEventListener('webkitTransitionEnd', this._boundTransitionEndHandler)
    this._element.removeEventListener('webkitAnimationEnd', this._boundAnimationEndHandler)
    this._element.removeEventListener('transitionend', this._boundTransitionEndHandler)
    this._element.removeEventListener('animationend', this._boundAnimationEndHandler)
    this._element.removeEventListener('oTransitionEnd', this._boundTransitionEndHandler)
    this._element.removeEventListener('oAnimationEnd', this._boundAnimationEndHandler)

    this._element = null
    this._callback = null
    this._listeners = null
  }

  get element () { return this._element }

  get callback () { return this._callback }

  get listeners () { return this._listeners }
}

export default ListenElement
