import vendor from './../utils/property'

class Listener {
  constructor (property, callback = null, timeout = null) {
    this._property = property
    this._vendorProperty = vendor(property)
    this._callback = callback
    this._timeout = timeout
  }

  destroy () {
    clearTimeout(this._timeout)
    this._property = null
    this._vendorProperty = null
    this._callback = null
    this._timeout = null
  }

  get property () { return this._property }

  get vendorProperty () { return this._vendorProperty }

  get callback () { return this._callback }

  get timeout () { return this._timeout }
}

export default Listener
