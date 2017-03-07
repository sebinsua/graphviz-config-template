const { matchNode } = require('./create-node-statement');

const DIRECTION_LEFT = 'DIRECTION_LEFT';
const DIRECTION_RIGHT = 'DIRECTION_RIGHT';
const DIRECTION_NONE = 'DIRECTION_NONE';

// TODO: This code should be shared with the other project.
const stripWhitespace = str => str.trim().replace(/\s+/g, ' ')

function createRelationshipStatement ({
  left,
  right,
  type,
  direction = DIRECTION_NONE
}) {
  const getRelationship = (_type, _direction) => {
    const baseRelationship = `-[r${_type ? `:${_type}` : ''}]-`;
    switch (_direction) {
      case DIRECTION_LEFT:
        return `<${baseRelationship}`;
        break;
      case DIRECTION_RIGHT:
        return `${baseRelationship}>`;
        break;
      default:
      case DIRECTION_NONE:
        return baseRelationship;
    }
  };

  const leftNodeName = 'left';
  const rightNodeName = 'right';
  const leftIdName = left.idName || 'id';
  const rightIdName = right.idName || 'id';
  const leftParamName = `${leftNodeName}_${leftIdName}`;
  const rightParamName = `${rightNodeName}_${rightIdName}`;
  return {
    statement: stripWhitespace(`
      MATCH
        ${matchNode(leftNodeName, left.label, leftIdName, leftParamName)},
        ${matchNode(rightNodeName, right.label, rightIdName, rightParamName)}
      MERGE (${leftNodeName})${getRelationship(type, direction)}(${rightNodeName})
    `),
    parameters: {
      [leftParamName]: left.id,
      [rightParamName]: right.id
    }
  };
}

module.exports = createRelationshipStatement;
module.exports.createRelationshipStatement = createRelationshipStatement;
module.exports.DIRECTION_LEFT = DIRECTION_LEFT;
module.exports.DIRECTION_RIGHT = DIRECTION_RIGHT;
module.exports.DIRECTION_NONE = DIRECTION_NONE;
