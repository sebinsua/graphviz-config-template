const test = require('ava')

const toAttributes = require('../src/to-attributes')

test('toAttributes(value) accepts falsey', t => {
  t.is(toAttributes(), '')
})

test('toAttributes(value) accepts objects', t => {
  t.is(toAttributes({ hey: 'there', you: 'ok' }), 'hey=there,you=ok')
})

test('toAttributes(value) accepts strings that contain an equals sign', t => {
  t.is(toAttributes('hey=there,you=ok'), 'hey=there,you=ok')
})

test(
  'toAttributes(value) rejects strings that do not contain an equals sign',
  t => {
    t.throws(() => toAttributes('hey,there'), Error)
  }
)

test('toAttributes() accepts an array of tuples', t => {
  t.is(toAttributes([['hey', 'there'], ['you', 'ok']]), 'hey=there,you=ok')
})

test('toAttributes() accepts an array of key-value objects', t => {
  t.is(
    toAttributes([{ key: 'hey', value: 'there' }, { key: 'you', value: 'ok' }]),
    'hey=there,you=ok'
  )
})
