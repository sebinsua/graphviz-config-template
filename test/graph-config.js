const test = require('ava')

const graphConfig = require('../src')

const { digraph, graph } = graphConfig()

// TODO: Write usage examples for imaginary implementation.
// TODO: Test edge-cases.

test('can represent a simple graph', t => {
  /*
  const save = graph`
    A -> B [label="LIKES"];
    A -> C [label="LOVES"];
  `

  const statements = save({
    A: { id: 10, body: 'body text' },
    B: { id: 25 },
    C: { type: [ 'C', 'LABEL_OF_C' ], id: 100 }
  })
   */
})

test('can represent a complex graph with one-to-many relationships, transformations, etc', t => {
  /*
  // NOTE: labels on nodes and relationships: http://stackoverflow.com/a/6055235
  const A_1 = { sides: 3 }
  const A_2 = { sides: 5 }
  const B = { sides: 5 }
  const C = { sides: 8 }

  const typeToLabel = props => ({ label: props.type, id: props.id })
  const save = digraph`
    A [idName=aId,${A_1}];
    B [idName=bId,${B}]
    C [idName=id,${using('C')(typeToLabel)}];
    D [idName=id,${using('D')(typeToLabel)}];

    A -> B [label="LIKES"];
    A -> C -> D [label="LOVES"];
  `

  const statements = save({
    A: { id: 10, body: 'body text' }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
    B: [ { id: 25 }, { id: 30 }, { id: 35 }, { id: 40 }, { id: 45 } ],
    C: { type: [ 'C', 'LABEL_OF_C' ], id: 100 },
    D: { type: [ 'D', 'LABEL_OF_D' ], id: 500 }
  })
  */
})

test('can switch the direction of the relationships', t => {
  /*
  const save = digraph`
    A -> B [dir="forward",label="LIKES"];
    A -> C -> D [dir="back",label="LOVES"];
  `

  const statements = save({
    A: { id: 10, body: 'body text' }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
    B: [ { id: 25 }, { id: 30 }, { id: 35 }, { id: 40 }, { id: 45 } ],
    C: { type: [ 'C', 'LABEL_OF_C' ], id: 100 },
    D: { type: [ 'D', 'LABEL_OF_D' ], id: 500 }
  })
   */
})

test('can represent nodes connected to themselves', t => {
  /*
  const selfConnected = digraph`
    opinion

    fact_1 [label="fact"]
    fact_2 [label="fact"]

    fact_1 -> fact_2
  `
  */
})
