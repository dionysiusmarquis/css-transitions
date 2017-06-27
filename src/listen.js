import ListenElement from './components/listen-element'
import Listener from './components/listener'
import vendor from './utils/property'

const listenElements = new Map()

function listen (element, listen = null, callback = null) {
  let all = !listen || listen === 'all'
  if (all && !callback) {
    throw new Error('Listener required if \'all\' properties are listened.')
  }

  let listenElement = listenElements.get(element)

  if (!listenElement) {
    listenElement = new ListenElement(element)
    listenElements.set(element, listenElement)
  }

  let events = {}
  let listeners = {}
  let resolved = new Set()
  let listenProperties = listen instanceof Array ? listen.map(property => vendor(property)) : [vendor(listen)]

  let promise = new Promise(
    resolve => {
      if (!all) {
        let resolveCallback = (element, listener, event) => {
          let property = listener._property
          events[property] = event
          listeners[property] = listener
          resolved.add(vendor(property))

          console.log(resolved, listenProperties)

          let unresolved = listenProperties.filter(property => !resolved.has(property))

          if (!unresolved.length) {
            resolve({element, listeners, events})
            removeListener(element._element, listen, resolveCallback)
          }
        }

        listenElement.add(listen, resolveCallback)
      } else {
        resolve()
      }
    }
  )

  if (callback) {
    listenElement.add(listen, callback)
  }

  return promise
}

function removeListener (element, listen, listener) {
  let listenElement = listenElements.get(element)

  if (listenElement) {
    listenElement.remove(listen, listener)

    if (!Object.keys(listenElement._listeners).length) {
      console.log(listenElements)
      listenElements.delete(element)
      listenElement.destroy()
      console.log(listenElements)
    }
  }
}

function getListenerElement (element) {
  return listenElements.get(element)
}

function getListener (element, property) {
  let listenElement = listenElements.get(element)

  if (listenElement) {
    return listenElement.get(property)
  }
}

function hasListener (element, property, listener) {
  let listeners = getListener(element, property)

  if (listener) {
    return listeners.indexOf(listener) !== -1
  } else {
    return false
  }
}

export default listen
export {
  removeListener,
  removeListener as remove,
  getListenerElement,
  getListenerElement as getElement,
  getListener,
  getListener as get,
  hasListener,
  hasListener as has,
  ListenElement,
  Listener,
  vendor
}
