class Values {
  constructor (polyfilled, start, end, finish) {
    this.polyfilled = polyfilled
    this.start = start
    this.end = end
    this.finish = finish
  }
}

function auto (element, computed, property, resolved) {
  let start = computed[property]

  let currentValue = element.style[property]
  element.style[property] = resolved.end
  let end = getComputedStyle(element)[property]
  element.style[property] = currentValue

  if (end !== resolved.end || start !== currentValue) {
    return new Values(true, start, end, resolved.end)
  }

  return resolved
}

function position (element, computed, property, resolved) {
  // if (property === 'position' && value !== computed['position']) {
  //   values.polyfilled = true
  //
  //   let currentRect = element.getBoundingClientRect()
  //   let currentValue = element.style['position']
  //   element.style['position'] = value
  //   let endRect = element.getBoundingClientRect()
  //   element.style['position'] = currentValue
  //
  //   values.start = {
  //     position: value === 'static' ? 'relative' : value
  //   }
  //
  //   values.end = {
  //
  //   }
  //
  //   values.finish = {
  //     position: element.style['position'],
  //     width: element.style['width'],
  //     height: element.style['position'],
  //   }
  // }
  return resolved
}

export {Values, auto, position}
