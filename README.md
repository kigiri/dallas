# `dallas`

La classe, dallas.

## Install

```bash
# React is a peer dependencie
npm i dallas react
```

## API

The api provide a `classe` wrapper function.

### Basic usage

```js
import { React, classe } from 'classe'
// classe takes 2 arguments
// an option and a render function
const Button = classe('my-button', props => <button {...props} />)

// this JSX:
<Button className='big' />
// render this dom
<button className='big my-button' />
```

> `React` is passed down for convenience

### You can pass in an array of classNames

```js
import { React, classe } from 'dallas'

import style from './Wrapper.module.css'

const Wrapper = classe([ 'container', style.Wrapper ])

// This JSX
<Wrapper />
// render this dom
<div class="container Wrapper__Wrapper_aQn7" />
```

> The second argument (the render function) is _optionnal_  
> It will default to rendering the className to a `div`.
> props => <div className={props.className}>Merged class names !</div>)

#### boolean class flags

all keys that have `strings` values genereate boolean flags as short hands for applying css classes.

```js
// options can be passed last or first.
export const FlagClass = classe({
  disabled: 'dis',
  selected: 'bp-selected',
})

// this JSX
<FlagClass disabled selected />
// render this dom
<div class="dis bp-selected" />

// and this JSX
<FlagClass selected className="pouet"/>
// render this dom
<div class="pouet bp-selected" />
```

> You can not use `className` or `classNames` as a flag.

#### class matcher

A class matcher is a switch, it use a string or a function for more complex logic.

```js
// options can be passed last or first.
export const Matcher = classe({
  color: {
    info: 'color-blue',
    warning: 'color-yellow',
    error: 'color-red',
  },
  status: data => data.endDate > Date.now() ? 'available' : 'unavailable'
})

// this JSX
<Matcher color="error" />
// render this dom
<div class="color-red" />

// and this JSX
<Matcher status={{ endDate: Date.now() + 1000 }} />
// render this dom
<div class="available" />

// while
<Matcher status={{ endDate: 0 }} />
// would render this dom
<div class="available" />
```

The render functions are `memo` by default,
if you want not to `memo` the function, use
either `classe.noMemo` or `classeNoMemo`.
