#!/usr/bin/env node

const debug = require('debug')('graph-config-template')
const parse = require('dotparser')

const createNodeStatement = require('./create-node-statement');
const createRelationshipStatement = require('./create-relationship-statement')

const identity = v => v
const exists = v => !!v
const always = v => () => v
const invokeWith = (...args) => fn => fn(...args)
const flatten = (arr = []) => arr.reduce((acc, curr) => acc.concat(curr), [])

const arity = fn => fn.length || 0
function curry (fn) {
  const len = arity(fn)

  let invokedArgs = []
  function curriedFn (...args) {
    invokedArgs = invokedArgs.concat(args)
    if (invokedArgs.length >= len) {
      return fn(...invokedArgs)
    } else {
      return curriedFn
    }
  }
  curriedFn.displayName = fn.displayName || fn.name || 'AnonymousFunction'

  return curriedFn
}

const GENERIC_NODE_TYPE = 'Node'
const GENERIC_RELATIONSHIP_TYPE = 'Relationship'
const DEFAULT_ID_NAME = 'id'

const using = curry((label, fn) => {
  const transform = (props = {}) => fn(props[label])
  transform.label = label
  return transform
})

const DEFAULT_GRAPH_CONFIG = {
  [GENERIC_NODE_TYPE]: createNodeStatement,
  [GENERIC_RELATIONSHIP_TYPE]: createRelationshipStatement
}

// TODO: also expose this since it is useful on its own.
function toAttributes (obj) {
  return obj ?
    Object.keys(obj).reduce((acc, curr) => {
      if (typeof obj[curr] === 'undefined') {
        throw new Error(`The key '${curr}' could not be found within the values passed in`)
      }
      acc.push(`${curr}=${obj[curr]}`)
      return acc
    }, []).join(',') :
    null
}

const generateValues = (interpolatedValues = [], values = {}) =>
  interpolatedValues
    .map(iv => typeof iv === 'function' ? iv : always(iv))
    .map(invokeWith(values))

const zipToString = (strs, attributes) => {
  return strs.map((str, idx) => [ str, attributes[idx] ].filter(exists).join('')).join('')
}

function nodesAndRelationships (strs = [], interpolatedValues = [], values = {}) {
  const attributes = generateValues(interpolatedValues, values).map(toAttributes)
  return zipToString(strs, attributes)
}

function createToStatements ({
  Node: createNode,
  Relationship: createRelationship
}) {
  const isNodeStatement = c => c.type === 'node_stmt'
  const isRelationshipStatement = c => c.type === 'edge_stmt'

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

  const toNode = ns => createNode({ label: toLabel(ns), idName: toIdName(ns), props: toProps(ns) })
  const toRelationships = (nss = []) => rs => {
    console.log(nss)
    console.log(rs)

    // rs.edge_list[*].id is a from left-to-right description marked by the attributes rs.attr_list
    // This function can result in N > 1 relations depending on the length of rs.edge_list

    // id for left/right comes from its props
    // createNodeMatcher should return an { id, label, idName } using the functions above

    // type should come from the relationship label

    // direction should come from the `dir` attribute

    // TODO: create Relationship:
    //       left (id, label, idName),
    //       right (id, label, idName),
    //       type (attribute of rel),
    //       direction (directionality of rel)
    return {} // createRelationship({})
  }
  return graph => {
    const children = graph.children || []
    const nodeDotStatements = children.filter(isNodeStatement)
    const relationshipDotStatements = children.filter(isRelationshipStatement)

    const nodeStatements = nodeDotStatements.map(toNode)
    // console.log(JSON.stringify(nodeStatements, null, 1))

    const edgeStatements = flatten(
      relationshipDotStatements.map(toRelationships(nodeDotStatements))
    )
    console.log(JSON.stringify(edgeStatements, null, 1))

    return [].concat(nodeStatements, edgeStatements)
  }
}

function graphConfig (options = DEFAULT_GRAPH_CONFIG) {
  const toStatements = createToStatements(options)

  function dot (strs, ...interpolatedValues) {
    return (values) => {
      const description = nodesAndRelationships(strs, interpolatedValues, values)
      debug('created description:', description)
      return flatten(
        parse(description).map(toStatements)
      )
    }
  }

  function graph (strs, ...interpolatedValues)  {
    return (values) => {
      const description = `graph { ${nodesAndRelationships(strs, interpolatedValues, values)} }`
      debug('created description:', description)
      return flatten(
        parse(description).map(toStatements)
      )
    }
  }

  function digraph (strs, ...interpolatedValues) {
    return (values) => {
      const description = `digraph { ${nodesAndRelationships(strs, interpolatedValues, values)} }`
      debug('created description:', description)
      return flatten(
        parse(description).map(toStatements)
      )
    }
  }

  return {
    dot,
    graph,
    digraph
  }
}

// NOTE: labels on nodes and relationships: http://stackoverflow.com/a/6055235
const A_1 = { sides: 3 }
const A_2 = { sides: 5 }
const B = { sides: 5 }
const C = { sides: 8 }

const { digraph } = graphConfig();

// TODO: Optionality:
//       How to optional create nodes or relationships?
//       Try with subgraphs - can they be passed in?
//       How to visualise optional node or relationships?
//       Can props function return a graph for optionality?
//       Exists predicate function takes in template? Etc

// TODO: Should still be parseable by dot -- will need to ignore variable interpolation.
// TODO: Think about how to display inline:
//       https://atom.io/packages/preview-inline
//       https://atom.io/packages/inline-markdown-images

// TODO: I want to be able to pass in multiple labels.

// TODO: I want to clean the attributes of dot only stuff before sending them to neo4j.

const typeToLabel = using('C')(props => ({ label: props.type, id: props.id }))
const out = digraph`
  A [id=25,${A_1}];
  B [id=50,${B}]
  C [idName=id,${typeToLabel}];

  A -> B;
  B -> C -> D;
`;

const statements = out({
  C: { type: 'LABEL_OF_C', id: 100 }
})

/*
console.log(
  JSON.stringify(
    statements,
    null,
    2
  )
);
*/

// How to represent connections between a node and its self:
const selfConnected = digraph`
  opinion

  fact_1 [label="fact"]
  fact_2 [label="fact"]

  fact_1 -> fact_2
`
// TODO: Write usage examples for imaginary implementation.
