#!/usr/bin/env node

const debug = require('debug')('graph-config-template')
const parse = require('dotparser')

const identity = v => v
const exists = v => !!v

const DEFAULT_GRAPH_CONFIG = {
  Node: identity,
  Relationship: identity
}

function toAttributes (obj) {
  return obj ?
    Object.keys(obj).reduce((acc, curr) => {
      acc.push(`${curr}=${obj[curr]}`)
      return acc
    }, []).join(',') :
    null
}

const zipToString = (strs, values) => strs.map((str, idx) => [ str, values[idx] ].filter(exists).join('')).join('')

function nodesAndRelationships (strs, values) {
  return zipToString(strs, values.map(toAttributes))
}

function graphConfig ({ Node, Relationship } = DEFAULT_GRAPH_CONFIG) {
  // TODO: dot(createNode, create relation)`graph g` can be used to alter node generation implementation etc.
  // TODO: What about specific nodes or relations though?
  //       Base it on either the name of the node, or the label, or a fallback to its type.

  function dot (strs, ...interpolatedValues) {
    return (values) => {
      return parse(nodesAndRelationships(strs, interpolatedValues))
    }
  }

  function graph (strs, ...interpolatedValues)  {
    return (values) => {
      return parse(`graph { ${nodesAndRelationships(strs, interpolatedValues)} }`)
    }
  }

  function digraph (strs, ...interpolatedValues) {
    return (values) => {
      // TODO: Add a few debug statements.
      // TODO: Props function should return object which gets to attributes call on it.
      // TODO: Transform at end on values.
      // TODO: How to pass in values object into a props function?
      return parse(`digraph { ${nodesAndRelationships(strs, interpolatedValues)} }`)
    }
  }

  return {
    dot,
    graph,
    digraph
  }
}

// TODO NOW:
// TODO: Implement the `props => props.value` template style.

// TODO: Convert graph configuration into Neo4j statements.
// https://github.com/sebinsua/stream-to-neo4j/blob/master/src/relationship.js
// https://github.com/sebinsua/stream-to-neo4j/blob/master/src/node.js

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

//   TODO: Should still be parseable by dot.
//   TODO: Think about how to display inline:
//         https://atom.io/packages/preview-inline
//         https://atom.io/packages/inline-markdown-images

const out = digraph`
  A [${A_1}] -> A [${A_2}];
  B -> C;
`;
console.log(JSON.stringify(out(), null, 2));

// How to represent connections between a node and its self:
const selfConnected = digraph`
  opinion

  fact_1 [label="fact"]
  fact_2 [label="fact"]

  fact_1 -> fact_2
`
// TODO: Write usage examples for imaginary implementation.
