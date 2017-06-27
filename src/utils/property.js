import prefix from 'prefix-style'

function camelize (str) {
  return str.replace(/[_.-](\w|$)/g, (_, x) => {
    return x.toUpperCase()
  })
}

function dasherize (str) {
  return str.trim().replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase()
}

function vendor (property, dashes = false) {
  property = prefix(camelize(property))
  return dashes ? dasherize(property) : property
}

export default vendor
export {camelize, dasherize}
