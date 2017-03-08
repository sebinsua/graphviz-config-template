const test = require('ava')

test('an example test', t => {
  t.true(true)
})

// TODO: Write usage examples for imaginary implementation.

// How to represent connections between a node and its self:
/*
const selfConnected = digraph`
  opinion

  fact_1 [label="fact"]
  fact_2 [label="fact"]

  fact_1 -> fact_2
`
*/

/*
// NOTE: labels on nodes and relationships: http://stackoverflow.com/a/6055235
const A_1 = { sides: 3 }
const A_2 = { sides: 5 }
const B = { sides: 5 }
const C = { sides: 8 }

const { digraph } = graphConfig()

A [idName=aId,${A_1}];
B [idName=bId,${B}]
C [idName=id,${using('C')(typeToLabel)}];
D [idName=id,${using('D')(typeToLabel)}];

const typeToLabel = props => ({ label: props.type, id: props.id })
const out = digraph`
  A -> B [dir="forward",label="LIKES"];
  A -> C -> D [dir="back",label="LOVES"];
`

const statements = out({
  A: { id: 10, body: 'body text' }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
  B: [ { id: 25 }, { id: 30 }, { id: 35 }, { id: 40 }, { id: 45 } ],
  C: { type: [ 'C', 'LABEL_OF_C' ], id: 100 },
  D: { type: [ 'D', 'LABEL_OF_D' ], id: 500 }
})

console.log(
  JSON.stringify(
    statements,
    null,
    2
  )
)
 */
