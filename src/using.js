const debug = require('debug')('using')

const { curry } = require('./utils')

const using = curry((name, fn) => {
  const transform = (props = {}) =>
    Array.isArray(props[name]) ? props[name].map(fn) : fn(props[name])
  transform._name = name
  debug(`wrapping function that will transform props that belong to the name (${name}).`)
  return transform
})

module.exports = using
