#!/usr/bin/env node

const debug = require('debug')('graph-config-template')
const parse = require('dotparser')

const createNodeStatement = require('./create-node-statement');
const createRelationshipStatement = require('./create-relationship-statement')

const {
  DIRECTION_RIGHT
} = createRelationshipStatement

const identity = v => v
const exists = v => !!v
const property = (prop, defaultValue) => v => v[prop] || defaultValue
const flatten = (arr = []) => arr.reduce((acc, curr) => acc.concat(curr), [])

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
function curry (fn) {
  const len = arity(fn)
  return createCurriedFn(len, fn, [])
}

const GENERIC_NODE_TYPE = 'Node'
const GENERIC_RELATIONSHIP_TYPE = 'Relationship'
const DEFAULT_ID_NAME = 'id'

// TODO: label should be renamed to nodeName
const using = curry((label, fn) => {
  const transform = (props = {}) => Array.isArray(props[label]) ? props[label].map(fn) : fn(props[label])
  transform.label = label
  return transform
})

const DEFAULT_GRAPH_CONFIG = {
  [GENERIC_NODE_TYPE]: createNodeStatement,
  [GENERIC_RELATIONSHIP_TYPE]: createRelationshipStatement
}

function toAttributes (obj) {
  if (!obj) {
    return null
  }

  if (typeof obj === 'string') {
    if (obj.indexOf('=') === -1) {
      throw new Error('Strings passed into toAttributes() must contain an equals sign. e.g. idName=id')
    }
    return obj
  } else if (Array.isArray(obj)) {
    return obj.map(kv => Array.isArray(kv) ? `${kv[0]}=${kv[1]}` : `${kv.key}=${kv.value}`).join(',')
  } else if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, curr) => {
      if (typeof obj[curr] === 'undefined') {
        throw new Error(`The key '${curr}' could not be found within the values passed in`)
      }
      acc.push(`${curr}=${obj[curr]}`)
      return acc
    }, []).join(',')
  }
}

const zipToString = (strs, attributes) => {
  return strs.map((str, idx) => [ str, attributes[idx] ].filter(exists).join('')).join('')
}

const createLabelToFunctionMap = (fns = []) => {
  const labelToFunctionMap = {}

  fns.forEach(fn => {
    if (!fn.label) {
      throw new Error('Functions passed into a graph must be wrapped with using() and given a label.')
    }
    labelToFunctionMap[fn.label] = fn
  })

  return labelToFunctionMap
}

function createDescription (strs = [], interpolatableValues = []) {
  const attributes = interpolatableValues.map(toAttributes)
  const description = zipToString(strs, attributes)
  return description
}

function createToStatements ({
  Node: createNode,
  Relationship: createRelationship
}) {
  const isNodeStatement = c => c.type === 'node_stmt'
  const isRelationshipStatement = c => c.type === 'edge_stmt'

  const getNodeName = node => node.node_id.id
  const toLabel = node => {
    const labelAttr = (node.attr_list || []).find(attr => attr.id === 'label')
    if (labelAttr) {
      return labelAttr.eq
    } else if (node.node_id.id) {
      return node.node_id.id
    }

    return GENERIC_NODE_TYPE
  }
  const toIdName = node => {
    const idNameAttr = (node.attr_list || []).find(attr => attr.id === 'idName')
    if (idNameAttr) {
      return idNameAttr.eq
    }
    return DEFAULT_ID_NAME
  }
  const toProps = (node) =>
    (node.attr_list || []).reduce((acc, curr) => {
      if (curr.id !== 'idName') {
        acc[curr.id] = curr.eq
      }
      return acc
    }, {})

  return ({ graph, labelToFunctionMap = {}, values = {} }) => {

    const children = graph.children || []
    const nodeDotStatements = children.filter(isNodeStatement)
    const relationshipDotStatements = children.filter(isRelationshipStatement)

    const nodeStatements = flatten(
      nodeDotStatements.map(ns => {
        const nodeName = getNodeName(ns)
        const defaultLabel = toLabel(ns)
        const idName = toIdName(ns)

        // TODO: rename labelToFunctionMap
        const transform = labelToFunctionMap[nodeName] || property(nodeName)
        const transformedValues = transform(values)
        if (Array.isArray(transformedValues)) {
          return transformedValues.map(tvs => {
            const label = tvs.label || defaultLabel
            return createNode({
              label,
              idName,
              props: Object.assign({}, toProps(ns), tvs)
            })
          })
        } else {
          const label = (transformedValues || {}).label || defaultLabel
          if (!transformedValues) {
            debug(`No node named ${nodeName} could be found within the values object`)
          }
          return transformedValues
            ? createNode({
              label,
              idName,
              props: Object.assign({}, toProps(ns), transformedValues)
            })
            : null
        }
      }).filter(exists)
    )

    const edgeStatements = flatten(
      relationshipDotStatements.map(rs => {

        const nodes = rs.edge_list.map(e => e.id)
        const props = toProps(rs)

        const nodeToProps = nodes.map(nodeName => {
          const matchingNode = nodeDotStatements.find(nds => nds.node_id.id === nodeName)

          if (matchingNode) {
            const nodeName = getNodeName(matchingNode)
            const defaultLabel = toLabel(matchingNode)
            const idName = toIdName(matchingNode)

            const transform = labelToFunctionMap[nodeName] || property(nodeName)
            const transformedValues = transform(values)

            const props = toProps(matchingNode)

            return {
              nodeName,
              defaultLabel,
              idName,
              props: Array.isArray(transformedValues)
                ? transformedValues.map(tvs => Object.assign({}, props, tvs))
                : Object.assign({}, props, transformedValues)
            }
          }

          debug(`No node named ${nodeName} required by the relationship ${nodes.join(' -> ')} could be found within the values object`)
          return null
        }).filter(exists)

        if (nodeToProps.length < 2) {
          debug(`Found an invalid relationship ${nodes.join(' -> ')} with less than two nodes. This is possibly due to a node not existing within the values object.`)
          return
        }

        const relationships = [];
        for (let i = 0; i < nodeToProps.length; i++) {
          const left = nodeToProps[i]
          const right = nodeToProps[i + 1]
          if (!left || !right) {
            break
          }

          relationships.push(
            createRelationship({
              left: {
                id: left.props[left.idName],
                label: left.props.label || left.defaultLabel,
                idName: left.idName
              },
              right: {
                id: right.props[right.idName],
                label: right.props.label || right.defaultLabel,
                idName: right.idName
              },
              type: 'CONNECTED_TO', // TODO: Swap this for a real rs.type.
              direction: DIRECTION_RIGHT
            })
          )
        }

        // TODO: Disable the array relationship support to begin with:
        //       What does it mean to create a relationship when the does related to it are arrays of nodes?
        //       nodeToProps.props can be an array now.
        //       Perhaps: one to many, or many to one okay, but not many to many?
        return relationships
      })
    )

    return [].concat(nodeStatements, edgeStatements)
  }
}

function graphConfig (options = DEFAULT_GRAPH_CONFIG) {
  const toStatements = createToStatements(options)

  const toInterpolatableValuesAndFunctionMap = templateValues => {
    const labelToFunctionMap = createLabelToFunctionMap(
      templateValues.filter(v => typeof v === 'function')
    )
    const interpolatableValues = templateValues.filter(v => typeof v !== 'function')
    return {
      interpolatableValues,
      labelToFunctionMap
    }
  }

  const createSave = (strs, interpolatableValues, labelToFunctionMap, createDot = identity) => values => {
    const description = createDescription(strs, interpolatableValues)
    const dot = createDot(description)
    debug('created dot:', dot)
    return flatten(
      parse(dot).map(graph => toStatements({ graph, labelToFunctionMap, values }))
    )
  }

  function dot (strs, ...templateValues) {
    const { interpolatableValues, labelToFunctionMap } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toDot = identity

    return createSave(strs, interpolatableValues, labelToFunctionMap, toDot)
  }

  function graph (strs, ...templateValues)  {
    const { interpolatableValues, labelToFunctionMap } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toGraph = description => `graph { ${description} }`

    return createSave(strs, interpolatableValues, labelToFunctionMap, toGraph)
  }

  function digraph (strs, ...templateValues) {
    const { interpolatableValues, labelToFunctionMap } = toInterpolatableValuesAndFunctionMap(templateValues)
    const toDigraph = description => `digraph { ${description} }`

    return createSave(strs, interpolatableValues, labelToFunctionMap, toDigraph)
  }

  return {
    dot,
    graph,
    digraph
  }
}

// TODO: Fix problem in which no node statements are created for nodes only in relationships.
//       Nodes in relationships should not be created if missing data but no error.
//       Get it to work if the nodes are not within the digraph - instead just relationships.
// TODO: Describe problem of One to many to many
//       And potential solution: Use relationship attributes
//       But don't do it.
// TODO: Refactor until code is clean
// TODO: Add more debugs and docs.
// TODO: Pull errors to edges.
// TODO: I want to clean the attributes of dot only stuff before sending them to neo4j.
//       Learn meaning of each of these, just in case some are relevant.

// NOTE: labels on nodes and relationships: http://stackoverflow.com/a/6055235
const A_1 = { sides: 3 }
const A_2 = { sides: 5 }
const B = { sides: 5 }
const C = { sides: 8 }

const { digraph } = graphConfig();

// TODO: Get it to work with no directionality (graph mode, etc.) And specific directionality.

// TODO: Create issue for 'Optionality':
//       How to optional create nodes or relationships?
//       Try with subgraphs - can they be passed in?
//       How to visualise optional node or relationships?
//       Can props function return a graph for optionality?
//       Exists predicate function takes in template? Etc

// TODO: Should still be parseable by dot -- will need to ignore variable interpolation.
// TODO: Think about how to display inline:
//       https://atom.io/packages/preview-inline
//       https://atom.io/packages/inline-markdown-images

const typeToLabel = props => ({ label: props.type, id: props.id })
const out = digraph`
  A [idName=aId,${A_1}];
  B [idName=bId,${B}]
  C [idName=id,${using('C')(typeToLabel)}];
  D [idName=id,${using('D')(typeToLabel)}];

  A -> B;
  B -> C -> D;
`;

/*
TODO: Write some toAttributes tests.
console.log(toAttributes({ hey: 'there', 'you': 'ok' }))
console.log(toAttributes('hey=there,you=ok'))
console.log(toAttributes( [ [ 'hey', 'there' ], [ 'you', 'ok' ] ] ))
console.log(toAttributes( [ { key: 'hey', value: 'there' }, { key: 'you', value: 'ok' } ] ))
*/

const statements = out({
  A: { aId: 10 }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
  B: { bId: 25 },
  C: { type: [ 'C', 'LABEL_OF_C' ], id: 100 },
  D: { type: [ 'D', 'LABEL_OF_D' ], id: 500 }
})

console.log(
  JSON.stringify(
    statements,
    null,
    2
  )
);

// How to represent connections between a node and its self:
/*
const selfConnected = digraph`
  opinion

  fact_1 [label="fact"]
  fact_2 [label="fact"]

  fact_1 -> fact_2
`
*/
// TODO: Write usage examples for imaginary implementation.

module.exports.toAttributes = toAttributes;
