function toAttributes (obj) {
  if (!obj) {
    return ''
  }

  if (typeof obj === 'string') {
    if (obj.indexOf('=') === -1) {
      throw new Error(
        'Strings passed into toAttributes() must contain an equals sign. e.g. idName=id'
      )
    }
    return obj
  } else if (Array.isArray(obj)) {
    return obj
      .map(
        kv => Array.isArray(kv) ? `${kv[0]}=${kv[1]}` : `${kv.key}=${kv.value}`
      )
      .join(',')
  } else if (typeof obj === 'object') {
    return Object.keys(obj)
      .reduce(
        (acc, curr) => {
          if (typeof obj[curr] === 'undefined') {
            throw new Error(
              `The key '${curr}' could not be found within the values passed in`
            )
          }
          acc.push(`${curr}=${obj[curr]}`)
          return acc
        },
        []
      )
      .join(',')
  }
}

module.exports = toAttributes
