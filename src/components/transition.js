import Listener from './listener'
import vendor from './../utils/property'

class Transition extends Listener {
  constructor (property, value, duration = 0, easing = null, delay = 0, callback = null, timeout = null) {
    super(property, callback, timeout)
    this._value = value
    this._duration = duration
    this._easing = easing
    this._delay = delay
    this._string = null

    this.update()
  }

  update () {
    let duration = typeof this._duration === 'string' ? this._duration : (this._duration / 1000) + 's'
    let delay = this._delay ? typeof this._delay === 'string' ? this._delay : (this._delay / 1000) + 's' : null
    this._string = `${vendor(this._vendorProperty, true)} ${duration}${this._easing ? ' ' + this._easing : ''}${this._delay ? ' ' + delay : ''}`
  }

  destroy () {
    this._value = null
    this._duration = null
    this._easing = null
    this._delay = null
    this._string = null

    super.destroy()
  }

  toString () {
    return this._string
  }

  get value () { return this._value }

  get duration () { return this._duration }

  get easing () { return this._easing }

  get delay () { return this._delay }

  get string () { return this._string }
}

export default Transition
