import { deepStrictEqual as test } from 'assert'
import { classe, wrapper } from './index.js'

// data
const classNames = ['hello', 'world']
const expected = { className: classNames.join(' ') }
const matcher = { status: { online: 'on', offline: 'off' } }
const allOptions = {
  classNames,
  disabled: 'is-disabled',
  active: 'is-active',
  color: {
    primary: 'color-blue',
    warning: 'color-orange',
    error: 'color-red',
  },
}

const pass = _ => _
const applyDallas = (options, props) =>
  classe(options, pass)(Object.freeze(props))

/* APPLY CLASSNAME */
console.log('it should apply className')
test(applyDallas({ className: 'hello' }, {}), { className: 'hello' })

console.log('it should apply className (using string shorthand)')
test(applyDallas('hello', {}), { className: 'hello' })

console.log('it should concatenate to with existing className')
test(applyDallas('hello', { className: 'world' }), {
  className: 'world hello',
})

/* APPLY CLASSNAMES */
console.log('it should apply classNames')
test(applyDallas({ classNames }, {}), expected)

console.log('it should apply classNames (using array shorthand)')
test(applyDallas(classNames, {}), expected)

console.log('it should concatenate to with existing className')
test(applyDallas(classNames, { className: 'my' }), {
  className: 'my hello world',
})

console.log('it should only modify props on change')
test(applyDallas(classNames, expected) === expected, true)

/* APPLY FLAGS */
console.log('it should apply a single flag')
test(applyDallas({ x: 'x' }, { x: true }), { x: true, className: 'x' })

console.log('it should apply multiple flags')
test(applyDallas({ x: 'x', d: 'd' }, { x: true, d: true }), {
  x: true,
  d: true,
  className: 'x d',
})

console.log(
  'it should apply a single flag and concatenate with existing className',
)
test(applyDallas({ x: 'x' }, { x: true, className: 'a' }), {
  x: true,
  className: 'a x',
})

console.log(
  'it should apply multiple flags and concatenate with existing className',
)
test(applyDallas({ x: 'x', d: 'd' }, { x: true, d: true, className: 'a' }), {
  x: true,
  d: true,
  className: 'a x d',
})

console.log('it should only apply specified flags')
test(applyDallas({ x: 'x', d: 'd' }, { d: true, className: 'a' }), {
  d: true,
  className: 'a d',
})

console.log('it should return the same props if no flags are applied')
test(applyDallas({ x: 'x', d: 'd' }, expected), expected)

/* TEST CONSUME OPTS*/
console.log('consume options should not forward props')
test(
  applyDallas(
    { x: 'x', d: 'd', consume: true },
    { x: true, d: true, className: 'a' },
  ),
  { className: 'a x d' },
)

console.log('we should remove `false` flags on consume even with no classes')
test(applyDallas({ x: 'x', d: 'd', consume: true }, { x: false }), {})

/* APPLY MATCHER */
console.log('it should apply matcher')
test(applyDallas(matcher, { status: 'online' }), {
  status: 'online',
  className: 'on',
})

console.log('it should apply matcher and concatenate className')
test(applyDallas(matcher, { status: 'offline', className: 'a' }), {
  status: 'offline',
  className: 'a off',
})

console.log('it should not change the props when not matching')
test(applyDallas(matcher, expected), expected)

/* COMBINE ALL */
console.log('we shoud be able to combine all the options')
test(
  applyDallas(allOptions, {
    className: 'my-class',
    disabled: true,
    color: 'primary',
  }).className,
  'my-class hello world is-disabled color-blue',
)

console.log('if should return the same props if no changes were nescessary')
test(applyDallas(allOptions, expected), expected)

/* HANDLE WRAPPER FLAGS */
const Flags = wrapper({ hidden: 'opacity-0', ...allOptions })
const flagged = Flags.disabled.hidden(_ => _)

console.log('A flagged component has default classes')
test(flagged({}).className, 'hello world is-disabled opacity-0')

console.log('A flagged component can handle new props')
test(
  flagged({ color: 'primary' }).className,
  'hello world is-disabled opacity-0 color-blue',
)

console.log('we should be able to disabled a flag by passing `false`')
test(flagged({ disabled: false }).className, 'hello world opacity-0')

/* GROUPING */
const grouped = {
  mb1: 'margin_bottom_1',
  mb2: 'margin_bottom_2',
  mb3: 'margin_bottom_3',
  groups: /^([a-z]+)([0-9]+)$/i,
  consume: true,
}

console.log('grouped values should be mutualy exclusives')
test(applyDallas(grouped, { mb1: true, mb2: true }), { className: grouped.mb2 })

console.log('grouped values can be set with index')
test(applyDallas(grouped, { mb: 3 }), { className: grouped.mb3 })

console.log('it should use keep component name')
test(classe({}, pass).displayName, 'pass')

console.log('default name should be Div')
test(classe({}).displayName, 'Div')

console.log('we can specify another name')
test(classe({}, pass, 'Hey').displayName, 'Hey')
