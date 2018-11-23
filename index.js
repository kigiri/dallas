import React, { memo, createElement } from 'react'

const toDiv = props => createElement('div', props)
const applyClassName = (a, b) => (a && b ? `${a} ${b}` : b || a)
export const classeNoMemo = (options, render) => {
  if (!render) {
    render = toDiv
  } else if (typeof render !== 'function') {
    throw Error(`render argument must be a function`)
  }

  if (typeof options === 'string') {
    options = { className: options }
  } else if (Array.isArray(options)) {
    options = { classNames: options }
  }

  const baseClassName = Array.isArray(options.classNames)
    ? options.classNames.join(' ')
    : options.className

  const flags = {}
  const matcher = {}
  let hasKey = false
  for (const [k, v] of Object.entries(options)) {
    if (k === 'className' || k === 'classNames') continue
    if (!v) continue
    switch (typeof v) {
      case 'string':
        flags[k] = v
        hasKey = true
        break
      case 'function':
        matcher[k] = v
        hasKey = true
        break
      case 'object':
        matcher[k] = value => v[value]
        hasKey = true
        break
      default:
        break
    }
  }

  if (!hasKey) {
    // simple case, no flags or matcher specified
    return props => {
      if (baseClassName === props.className) return render(props)
      const className = applyClassName(props.className, baseClassName)
      if (className === props.className) return render(props)
      const newProps = Object.assign({}, props)
      newProps.className = className
      return render(newProps)
    }
  }

  return props => {
    let className =
      props.className === baseClassName
        ? baseClassName
        : applyClassName(props.className, baseClassName)

    const keys = Object.keys(props)
    for (const key of keys) {
      const value = props[key]
      className = applyClassName(className, flags[key])
      const match = matcher[key]
      if (match) {
        className = applyClassName(className, match(value))
      }
    }

    if (className === props.className) return render(props)
    const newProps = {}
    if (options.consume) {
      // consume props that match a flag
      for (const key of keys) {
        if (!flags[key] && !matcher[key]) {
          newProps[key] = props[key]
        }
      }
    } else {
      for (const key of keys) {
        newProps[key] = props[key]
      }
    }
    newProps.className = className
    return render(newProps)
  }
}

// forward react exports
export * from 'react'

export const classe = (options, render) => memo(classeNoMemo(options, render))
export const wrapper = (classes, classFlags) =>
  new Proxy(
    render => {
      if (render) return classe(classes, render)
      const i = classes.length - 1
      const nodeType = classes[i]
      return classe(
        { classFlags, classNames: classes.slice(0, i), consume: true },
        props => createElement(nodeType, props),
      )
    },
    { get: (_, key) => wrapper([...classes, classFlags[key]], classFlags) },
  )
classe.noMemo = classeNoMemo
