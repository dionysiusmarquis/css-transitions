import TransitionElement from './components/transition-element'
import Transition from './components/transition'
import vendor from './utils/property'

const transitionElements = new Map()

function transition (element, properties, duration, options = {}) {
  let promise = new Promise(
    resolve => {
      let transitionElement = transitionElements.get(element)

      if (!transitionElement) {
        transitionElement = new TransitionElement(element)
        transitionElements.set(element, transitionElement)
      }

      let events = {}
      let transitions = {}
      let resolved = new Set()
      let propertyKeys = Object.keys(properties)

      let defaultOptions = {
        callback:
          (element, transition, event) => {
            let property = transition._property
            events[property] = event
            transitions[property] = transition
            resolved.add(property)

            let unresolved = propertyKeys.filter(property => !resolved.has(property))

            if (!unresolved.length) {
              resolve({element, transitions, events})
            }

            removeTransition(element._element, transition._vendorProperty)
          }
      }

      let transitionOptions = Object.assign({}, defaultOptions, options)

      transitionElement.add(properties, duration, transitionOptions)
    }
  )

  if (options.callback) {
    promise.then(data => options.callback(data.element, data.transition, data.event))
  }

  return promise
}

function removeTransition (element, property) {
  let transitionElement = getTransitionElement(element)

  if (transitionElement) {
    transitionElement.remove(property)

    if (!Object.keys(transitionElement._transitions).length) {
      transitionElements.delete(element)
      transitionElement.destroy()
    }
  }
}

function removeTransitions (element) {
  let transitionElement = getTransitionElement(element)

  if (transitionElement) {
    transitionElement.destroy()
  }
}

function getTransitionElement (element) {
  return transitionElements.get(element)
}

function getTransition (element, property) {
  let transitionElement = transitionElements.get(element)

  if (transitionElement) {
    return transitionElement.get(property)
  }
}

function hasTransition (element, property) {
  return !(!getTransition(element, property))
}

export default transition
export {
  removeTransition,
  removeTransition as remove,
  removeTransition as stopTransition,
  removeTransitions,
  removeTransitions as stop,
  removeTransitions as stopTransitions,
  getTransitionElement,
  getTransitionElement as getElement,
  getTransition,
  getTransition as get,
  hasTransition,
  hasTransition as has,
  TransitionElement,
  Transition,
  vendor
}
