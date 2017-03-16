const test = require('ava')

const graphConfig = require('../src')
const { using } = graphConfig

const { digraph, graph } = graphConfig()

test('can represent simple graph', t => {
  const save = graph`
    A -> B [label="LIKES"];
    A -> C [label="LOVES"];
  `

  const statements = save({
    A: { id: 10, body: 'body text' },
    B: { id: 25 },
    C: { type: ['C', 'LABEL_OF_C'], id: 100 }
  })

  t.snapshot(statements)
})

test('can represent complex graph (1-to-m, transformations)', t => {
  const A_1 = { sides: 3 }
  const B = { sides: 5 }

  const typeToLabel = props => ({ label: props.type, id: props.name })
  const save = digraph`
  A [idName=aId,${A_1}];
  B [idName=bId,${B}]
  C [idName=id,${using('C')(typeToLabel)}];
  D [idName=id,${using('D')(typeToLabel)}];

  A -> B [label="LIKES"];
  A -> C -> D [label="LOVES"];
  `

  const statements = save({
    A: { aId: 10, body: 'body text' }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
    B: [{ bId: 25 }, { bId: 30 }, { bId: 35 }, { bId: 40 }, { bId: 45 }],
    C: { type: ['C', 'LABEL_OF_C'], name: 'Joe' },
    D: { type: ['D', 'LABEL_OF_D'], name: 'America' }
  })

  t.snapshot(statements)
})

test('can switch the direction of the relationships', t => {
  const save = digraph`
    A -> B [dir="forward",label="LIKES"];
    A -> C -> D [dir="back",label="LOVES"];
  `

  const statements = save({
    A: { id: 10, body: 'body text' }, // [ { aId: 10 }, { aId: 15 }, { aId: 20 } ],
    B: [{ id: 25 }, { id: 30 }, { id: 35 }, { id: 40 }, { id: 45 }],
    C: { type: ['C', 'LABEL_OF_C'], id: 100 },
    D: { type: ['D', 'LABEL_OF_D'], id: 500 }
  })

  t.snapshot(statements)
})

test('can represent nodes connected to themselves', t => {
  const save = digraph`
    opinion

    fact_1 [label="fact"]
    fact_2 [label="fact"]

    fact_1 -> fact_2
  `

  const statements = save({
    opinion: { id: 1, message: 'this is probably broken' },
    fact_1: { id: 101, message: '1 + 1 = 2' },
    fact_2: { id: 9000, message: 'snapshots are cool' }
  })

  t.snapshot(statements)
})

test('can represent some *real* database', t => {
  const save = digraph`
    parent_account [label="User"]
    child_account [label="User"]

    parent_tweet [label="Tweet"]
    child_tweet [label="Tweet"]

    parent_account -> parent_tweet [label="TWEETED"]
    child_account -> child_tweet [label="TWEETED"]

    child_tweet -> parent_tweet [label="REPLIED_TO"]
  `

  const statements = save({
    parent_account: { id: 987654321, name: 'Soul' },
    child_account: { id: 1, name: 'Creator' },
    parent_tweet: { id: 1000, message: 'Why would I do this though?' },
    child_tweet: { id: 2000, message: 'This is a bad example. I am sorry.' }
  })

  t.snapshot(statements)
})
