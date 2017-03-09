const graphConfig = require('./graph-config')
const toAttributes = require('./to-attributes')
const using = require('./using')

const { NEO4J_GRAPH_CONFIG, createToStatements } = require('./neo4j')

module.exports = graphConfig.bind(null, createToStatements(NEO4J_GRAPH_CONFIG))
module.exports.toAttributes = toAttributes
module.exports.using = using
