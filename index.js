import React, { memo, createElement } from 'react'

const toDiv = props => createElement('div', props)
const applyClassName = (a, b) => (a && b ? `${a} ${b}` : b || a)
const prepareOptions = options => {
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
    if (k === 'className' || k === 'classNames' || k === 'consume') continue
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
  return { matcher, flags, hasKey, consume: options.consume, baseClassName }
}

const dallas = ({ matcher, flags, hasKey, consume, baseClassName }, render) => {
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
    let disabled
    let className =
      props.className === baseClassName
        ? baseClassName
        : applyClassName(props.className, baseClassName)

    const keys = Object.keys(props)
    for (const key of keys) {
      const match = matcher[key]
      if (match) {
        className = applyClassName(className, match(props[key]))
      } else if (props[key]) {
        className = applyClassName(className, flags[key])
      } else {
        disabled || (disabled = new Set())
        disabled.add(flags[key])
      }
    }

    if (className === props.className) return render(props)
    const newProps = {}
    if (consume) {
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

    if (disabled) {
      const classSet = new Set(className.split(' '))
      for (const disabledClass of disabled) {
        classSet.delete(disabledClass)
      }
      newProps.className = [...classSet].join(' ')
    } else {
      newProps.className = className
    }

    if (newProps.elemRef) {
      newProps.ref = newProps.elemRef
      delete newProps.elemRef
    }

    return render(newProps)
  }
}

export const classeNoMemo = (options, render) => {
  if (!render) {
    render = toDiv
  } else if (typeof render !== 'function') {
    throw Error(`render argument must be a function`)
  }
  return dallas(prepareOptions(options), render)
}

// forward react exports
export * from 'react'

export const classe = (options, render) => memo(classeNoMemo(options, render))
export const wrapper = options => {
  const { baseClassName, ...opts } = prepareOptions(options)
  const stepper = classes =>
    new Proxy(
      render => {
        if (render) {
          return dallas({ ...opts, baseClassName: classes.join(' ') }, render)
        }
        const i = classes.length - 1
        const nodeType = classes[i]
        return dallas(
          { ...opts, baseClassName: classes.slice(0, i).join(' ') },
          props => createElement(nodeType, props),
        )
      },
      { get: (_, key) => stepper([...classes, options[key] || key]) },
    )
  return stepper(baseClassName ? [baseClassName] : [])
}
classe.noMemo = classeNoMemo
