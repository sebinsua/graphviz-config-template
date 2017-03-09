const identity = v => v
const exists = v => !!v
const property = (prop, defaultValue) => v => v[prop] || defaultValue
const flatten = (arr = []) =>
  arr.reduce((acc, curr = []) => acc.concat(curr), [])

const arity = fn => fn.length || 0

const createCurriedFn = (len, fn, invokedArgs = []) => {
  function curriedFn (...args) {
    let currentInvokedArgs = invokedArgs.concat(args)
    if (currentInvokedArgs.length >= len) {
      const ret = fn(...currentInvokedArgs)
      currentInvokedArgs = []
      return ret
    } else {
      return createCurriedFn(len, fn, currentInvokedArgs)
    }
  }
  curriedFn.displayName = fn.displayName || fn.name || 'AnonymousFunction'

  return curriedFn
}
const curry = fn => {
  const len = arity(fn)
  return createCurriedFn(len, fn, [])
}

const zipToString = (strs, attributes) => {
  return strs
    .map((str, idx) => [str, attributes[idx]].filter(exists).join(''))
    .join('')
}

const arrify = (...args) => [].concat(...args)

module.exports = {
  identity,
  exists,
  property,
  flatten,
  curry,
  zipToString,
  arrify
}
