const { curry } = require('./utils')

const using = curry((name, fn) => {
  const transform = (props = {}) =>
    Array.isArray(props[name]) ? props[name].map(fn) : fn(props[name])
  transform._name = name
  return transform
})

module.exports = using
