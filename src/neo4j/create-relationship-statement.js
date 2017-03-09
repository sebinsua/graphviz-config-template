const cleanProperties = require('./clean-properties')

const { matchNode } = require('./create-node-statement')

const DIRECTION_LEFT = 'DIRECTION_LEFT'
const DIRECTION_RIGHT = 'DIRECTION_RIGHT'
const DIRECTION_NONE = 'DIRECTION_NONE'

const stripWhitespace = str => str.trim().replace(/\s+/g, ' ')

function createRelationshipStatement (
  {
    left,
    right,
    type,
    direction = DIRECTION_NONE,
    relationshipProps = {}
  }
) {
  const getRelationship = (_relationshipName, _type, _direction) => {
    const baseRelationship = `-[${_relationshipName}${_type ? `:${_type}` : ''}]-`
    switch (_direction) {
      case DIRECTION_LEFT:
        return `<${baseRelationship}`
      case DIRECTION_RIGHT:
        return `${baseRelationship}>`
      default:
      case DIRECTION_NONE:
        return baseRelationship
    }
  }

  const leftNodeName = 'left'
  const rightNodeName = 'right'
  const relationshipName = 'r'
  const leftIdName = left.idName || 'id'
  const rightIdName = right.idName || 'id'
  const leftParamName = `${leftNodeName}_${leftIdName}`
  const rightParamName = `${rightNodeName}_${rightIdName}`
  return {
    statement: stripWhitespace(
      `
      MATCH
        ${matchNode(leftNodeName, left.label, leftIdName, leftParamName)},
        ${matchNode(rightNodeName, right.label, rightIdName, rightParamName)}
      MERGE (${leftNodeName})${getRelationship(relationshipName, type, direction)}(${rightNodeName})
      SET ${relationshipName} += $relationshipProps
    `
    ),
    parameters: {
      [leftParamName]: left.id,
      [rightParamName]: right.id,
      relationshipProps: cleanProperties(relationshipProps)
    }
  }
}

module.exports = createRelationshipStatement
module.exports.createRelationshipStatement = createRelationshipStatement
module.exports.DIRECTION_LEFT = DIRECTION_LEFT
module.exports.DIRECTION_RIGHT = DIRECTION_RIGHT
module.exports.DIRECTION_NONE = DIRECTION_NONE
