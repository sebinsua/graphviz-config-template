const { arrify } = require('../utils')

const createToStatements = require('./create-to-statements')
const createNodeStatement = require('./create-node-statement')
const createRelationshipStatement = require('./create-relationship-statement')
const {
  GENERIC_NODE_TYPE,
  GENERIC_RELATIONSHIP_TYPE
} = require('../constants')

const NEO4J_GRAPH_CONFIG = {
  [GENERIC_NODE_TYPE]: createNodeStatement,
  [GENERIC_RELATIONSHIP_TYPE]: createRelationshipStatement,
  __wrap: arrify
}

module.exports = {
  createToStatements,
  NEO4J_GRAPH_CONFIG
}
