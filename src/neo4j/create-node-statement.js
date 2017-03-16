const cleanProperties = require('./clean-properties')

const { MissingIdError } = require('../errors')

const matchNode = (node, label, idName, paramName) => {
  paramName = paramName || idName
  const labels = label
    ? `:${Array.isArray(label) ? label.join(':') : label}`
    : ''
  return `(${node}${labels} { ${idName}: {${paramName}} })`
}

function createNodeStatement (
  {
    label,
    props = {},
    idName = 'id'
  }
) {
  if (!props[idName]) {
    throw new MissingIdError(
      `The id field '${idName}' cannot be found within the props of the Node labelled '${label}'.`
    )
  }

  const remainingProps = Object.assign({}, props)
  delete remainingProps[idName]

  const nodeName = 'n'
  return {
    statement: `MERGE ${matchNode(nodeName, label, idName)} SET ${nodeName} += $remainingProps`,
    parameters: {
      [idName]: props[idName],
      remainingProps: cleanProperties(remainingProps)
    }
  }
}

module.exports = createNodeStatement
module.exports.matchNode = matchNode
