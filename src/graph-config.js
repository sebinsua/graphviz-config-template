const debug = require('debug')('graph-config-template')
const parse = require('dotparser')

const toAttributes = require('./to-attributes')
const { flatten, identity, zipToString } = require('./utils')

const createNameToFunctionMap = (fns = []) => {
  const nameToFunctionMap = {}

  fns.forEach(fn => {
    if (!fn._name) {
      throw new Error(
        'Functions passed into a graph must be wrapped with using() and given a name.'
      )
    }
    nameToFunctionMap[fn._name] = fn
  })

  return nameToFunctionMap
}

function createDescription (strs = [], interpolatableValues = []) {
  const attributes = interpolatableValues.map(toAttributes)
  const description = zipToString(strs, attributes)
  return description
}

function graphConfig (toStatements = identity) {
  const toInterpolatableValuesAndFunctionMap = templateValues => {
    const nameToFunctionMap = createNameToFunctionMap(
      templateValues.filter(v => typeof v === 'function')
    )
    const interpolatableValues = templateValues.filter(
      v => typeof v !== 'function'
    )
    return {
      interpolatableValues,
      nameToFunctionMap
    }
  }

  const createSave = (
    strs,
    interpolatableValues,
    nameToFunctionMap,
    createDot = identity
  ) =>
    values => {
      const description = createDescription(strs, interpolatableValues)
      const dot = createDot(description)
      debug('created dot:', dot)
      return flatten(
        parse(dot).map(graph =>
          toStatements({ graph, nameToFunctionMap, values }))
      )
    }

  function dot (strs, ...templateValues) {
    const {
      interpolatableValues,
      nameToFunctionMap
    } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toDot = identity

    return createSave(strs, interpolatableValues, nameToFunctionMap, toDot)
  }

  function graph (strs, ...templateValues) {
    const {
      interpolatableValues,
      nameToFunctionMap
    } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toGraph = description => `graph { ${description} }`

    return createSave(strs, interpolatableValues, nameToFunctionMap, toGraph)
  }

  function digraph (strs, ...templateValues) {
    const {
      interpolatableValues,
      nameToFunctionMap
    } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toDigraph = description => `digraph { ${description} }`

    return createSave(strs, interpolatableValues, nameToFunctionMap, toDigraph)
  }

  return {
    graphviz: dot,
    dot,
    graph,
    digraph
  }
}

module.exports = graphConfig
