import React, { memo, createElement } from 'react'

const E = Symbol('exclude')
const Div = props => createElement('div', props)
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
  const groups = {}
  const excludes = {}
  let hasKey = false

  for (const [k, v] of Object.entries(options)) {
    if (k === 'className' || k === 'classNames' || k === 'consume') continue
    if (!v) continue
    switch (typeof v) {
      case 'string':
        hasKey = true
        if (options.groups && options.groups.test(k)) {
          const [, base, index] = k.split(options.groups)
          const group = groups[base] || (groups[base] = { [E]: new Set() })
          excludes[k] = { value: v, set: group[E].add(v) }
          group[index] = v
          matcher[base] || (matcher[base] = key => group[key])
        }

        flags[k] = v
        break
      case 'function':
        hasKey = true
        matcher[k] = v
        break
      case 'object':
        hasKey = true
        matcher[k] = key => v[key]
        break
      default:
        break
    }
  }

  return {
    flags,
    hasKey,
    matcher,
    excludes,
    baseClassName,
    consume: options.consume,
  }
}

const dallas = (
  { matcher, flags, hasKey, consume, baseClassName, excludes },
  render,
) => {
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
      const exclude = excludes[key]
      if (exclude) {
        disabled || (disabled = new Set())
        for (const excludedClassName of exclude.set) {
          disabled.add(excludedClassName)
        }
        disabled.delete(exclude.value)
      }
      if (match) {
        className = applyClassName(className, match(props[key]))
      } else if (props[key]) {
        className = applyClassName(className, flags[key])
      } else {
        disabled || (disabled = new Set())
        disabled.add(flags[key])
      }
    }

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

    if (className) {
      if (disabled) {
        const classSet = new Set(className.split(' '))
        for (const disabledClass of disabled) {
          classSet.delete(disabledClass)
        }
        newProps.className = [...classSet].join(' ')
      } else {
        newProps.className = className
      }
    }

    if (newProps.elemRef) {
      newProps.ref = newProps.elemRef
      delete newProps.elemRef
    }

    return render(newProps)
  }
}

const withName = (displayName, comp) => {
  comp.displayName = displayName
  return comp
}

export const classe = (options, render, displayName) => {
  if (!render) {
    render = Div
  } else if (typeof render !== 'function') {
    throw Error(`render argument must be a function`)
  }
  displayName || (displayName = render.displayName || render.name)
  return withName(displayName, dallas(prepareOptions(options), render))
}

// forward react exports
export * from 'react'

export const wrapper = options => {
  const { baseClassName, ...opts } = prepareOptions(options)
  const stepper = classes =>
    new Proxy(
      render => {
        if (render) {
          const comp = dallas({ ...opts, baseClassName: classes.join(' ') }, render)
          return withName(render.displayName || render.name, comp)
        }
        const i = classes.length - 1
        const nodeType = classes[i]
        return dallas(
          { ...opts, baseClassName: classes.slice(0, i).join(' ') },
          withName(nodeType, props => createElement(nodeType, props)),
        )
      },
      { get: (_, key) => stepper([...classes, options[key] || key]) },
    )
  return stepper(baseClassName ? [baseClassName] : [])
}
