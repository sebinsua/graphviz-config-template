const debug = require('debug')('graph-config-template:neo4j')

// Ensure that we are not sending arrays, undefined or objects into Neo4j.
const cleanProperties = obj => {
  debug(
    'deleting or stringifying the values within an object so they can be saved by neo4j'
  )

  const newObj = Object.assign({}, obj)
  Object.keys(obj).forEach(key => {
    if (typeof newObj[key] === 'undefined') {
      delete newObj[key]
    } else if (Array.isArray(newObj[key]) || typeof newObj[key] === 'object') {
      newObj[key] = JSON.stringify(newObj[key])
    }
  })
  return newObj
}

module.exports = cleanProperties
