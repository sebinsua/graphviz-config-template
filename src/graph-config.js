const debug = require('debug')('graph-config-template')
const parse = require('dotparser')

const { UnacceptableTemplateFunctionError } = require('./errors')
const toAttributes = require('./to-attributes')
const { flatten, identity, zipToString } = require('./utils')

const isFunction = v => typeof v === 'function'
const isNotFunction = v => typeof v !== 'function'

const createNameToFunctionMap = (fns = []) => {
  const nameToFunctionMap = {}

  fns.forEach(fn => {
    if (!fn._name) {
      throw new UnacceptableTemplateFunctionError(
        'Functions passed into a graph must be wrapped with using() and given a name.'
      )
    }
    nameToFunctionMap[fn._name] = fn
  })

  debug('exposing a fns to transform namespaced props with:', Object.keys(nameToFunctionMap))
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
      templateValues.filter(isFunction)
    )
    const interpolatableValues = templateValues.filter(isNotFunction)

    return {
      interpolatableValues,
      nameToFunctionMap
    }
  }

  const createSave = (
    strs,
    interpolatableValues,
    nameToFunctionMap,
    wrapToDot = identity
  ) =>
    values => {
      const description = createDescription(strs, interpolatableValues)
      const dot = wrapToDot(description)
      debug('created underlying dot:', dot)
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
    const wrapToDot = identity

    debug('creating dot template')
    return createSave(strs, interpolatableValues, nameToFunctionMap, wrapToDot)
  }

  function graph (strs, ...templateValues) {
    const {
      interpolatableValues,
      nameToFunctionMap
    } = toInterpolatableValuesAndFunctionMap(templateValues)
    const wrapToGraph = description => `graph { ${description} }`

    debug('creating graph template')
    return createSave(strs, interpolatableValues, nameToFunctionMap, wrapToGraph)
  }

  function digraph (strs, ...templateValues) {
    const {
      interpolatableValues,
      nameToFunctionMap
    } = toInterpolatableValuesAndFunctionMap(templateValues)
    const wrapToDigraph = description => `digraph { ${description} }`

    debug('creating digraph template')
    return createSave(strs, interpolatableValues, nameToFunctionMap, wrapToDigraph)
  }

  return {
    graphviz: dot,
    dot,
    graph,
    digraph
  }
}

module.exports = graphConfig
