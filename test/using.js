const test = require('ava')

const using = require('../src/using')

test('using(name, fn) curries its arguments', t => {
  t.is(using('A').name, 'curriedFn')
  t.is(using('A')(v => v).name, 'transform')
})

test('using(name, fn) returns transform(props) with a _name bound to it', t => {
  t.is(using('C', v => v).name, 'transform')
  t.is(using('C', v => v)._name, 'C')
})

test('using(name, fn) returns transform(props) which can fn() an object', t => {
  const useNode = using('Node', v => v.type)
  t.is(useNode({ Node: { type: 'fake-type' } }), 'fake-type')
})

test('using(name, fn) returns transform(props) which can fn() an array', t => {
  const useNode = using('Node', v => v.type)
  t.deepEqual(
    useNode({
      Node: [
        { type: 'fake-type' },
        { type: 'fake-type-2' },
        { type: 'fake-type-3' }
      ]
    }),
    ['fake-type', 'fake-type-2', 'fake-type-3']
  )
})
