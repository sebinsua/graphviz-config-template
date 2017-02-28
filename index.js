#!/usr/bin/env node

const parse = require('dotparser')

function toAttributes (obj) {
  return obj ? Object.keys(obj).reduce((acc, curr) => {
    acc.push(`${curr}=${obj[curr]}`)
    return acc
  }, []).join(',') : null;
}

const exists = v => !!v
const zipToString = (strs, values) => strs.map((str, idx) => [ str, values[idx] ].filter(exists).join('')).join('')

function nodesAndRelationships (strs, values) {
  return zipToString(strs, values.map(toAttributes))
}

function graph (strs, ...values)  {
  return parse(`graph { ${nodesAndRelationships(strs, values)} }`)
}

function digraph (strs, ...values) {
  return parse(`digraph { ${nodesAndRelationships(strs, values)} }`)
}

// TODO: Design Tasks
//   TODO: Should be able to apply values before OR after, therefore return (values) => parse(...)
//   TODO: Implement the `props => props.value` template style.
//   TODO: Come up with a sane way of marking some nodes or relationships as optional.
//   TODO: Should still be parseable by dot.
//   TODO: Think about how to display inline:
//         https://atom.io/packages/preview-inline
//         https://atom.io/packages/inline-markdown-images



// TODO: Convert graph configuration into Neo4j statements.
// https://github.com/sebinsua/stream-to-neo4j/blob/master/src/relationship.js
// https://github.com/sebinsua/stream-to-neo4j/blob/master/src/node.js


// NOTE: labels on nodes and relationships: http://stackoverflow.com/a/6055235
const A = { sides: 3 };
const B = { sides: 5 };
const C = { sides: 8 };

const out = digraph`
  A [${A}];
  A -> B;
  B -> C;
`;

console.log(JSON.stringify(out, null, 2));
