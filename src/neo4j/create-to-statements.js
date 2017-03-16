const debug = require('debug')('graph-config-template:neo4j')

const { PoorlyDefinedRelationshipError } = require('../errors')

const { flatten, exists, property } = require('../utils')
const {
  DEFAULT_ID_NAME,
  UNDIRECTED_GRAPH,
  RELATIONSHIP_TYPE_DEFAULT,
  GENERIC_NODE_TYPE,
  DIRECTION_NONE,
  DIRECTION_RIGHT,
  DIRECTION_LEFT
} = require('../constants')

const isNodeStatement = c => c.type === 'node_stmt'
const isRelationshipStatement = c => c.type === 'edge_stmt'

const getNodeName = node => node.node_id.id
const toLabel = node => {
  const labelAttr = (node.attr_list || []).find(attr => attr.id === 'label')
  if (labelAttr && labelAttr.eq) {
    return labelAttr.eq
  } else if (node.node_id.id) {
    return node.node_id.id
  }

  return GENERIC_NODE_TYPE
}
const toIdName = node => {
  const idNameAttr = (node.attr_list || []).find(attr => attr.id === 'idName')
  if (idNameAttr && idNameAttr.eq) {
    return idNameAttr.eq
  }
  return DEFAULT_ID_NAME
}
const toProps = entity => (entity.attr_list || []).reduce(
  (acc, curr) => {
    if (curr.id !== 'idName') {
      acc[curr.id] = curr.eq
    }
    return acc
  },
  {}
)
const toType = relationship => {
  const typeAttr = (relationship.attr_list || []).find(
    attr => attr.id === 'label' || attr.id === 'type'
  )
  if (typeAttr && typeAttr.eq) {
    return typeAttr.eq
  }

  return RELATIONSHIP_TYPE_DEFAULT
}
const toDirection = (graphType, relationship) => {
  if (graphType === UNDIRECTED_GRAPH) {
    return DIRECTION_NONE
  }

  const dirAttr = (relationship.attr_list || []).find(
    attr => attr.id === 'dir'
  )
  if (dirAttr && dirAttr.eq) {
    const dirs = {
      forward: DIRECTION_RIGHT,
      back: DIRECTION_LEFT,
      both: DIRECTION_NONE,
      none: DIRECTION_NONE
    }
    return dirs[dirAttr.eq] || DIRECTION_NONE
  }

  return DIRECTION_NONE
}

function createToStatements (
  {
    Node: createNode,
    Relationship: createRelationship,
    __wrap: wrap
  }
) {
  return ({ graph, nameToFunctionMap = {}, values = {} }) => {
    const children = graph.children || []
    const nodeDotStatements = children.filter(isNodeStatement)
    const relationshipDotStatements = children.filter(isRelationshipStatement)

    const nodeStatements = flatten(
      nodeDotStatements
        .map(ns => {
          const nodeName = getNodeName(ns)
          const defaultLabel = toLabel(ns)
          const idName = toIdName(ns)

          const transform = nameToFunctionMap[nodeName] || property(nodeName)
          const transformedValues = transform(values)
          if (Array.isArray(transformedValues)) {
            debug(
              `${nodeName}${defaultLabel ? ` (${defaultLabel})` : ''} was given an array`
            )

            return transformedValues.map(tvs => {
              const label = tvs.label || defaultLabel
              return createNode({
                label,
                idName,
                props: Object.assign({}, tvs)
              })
            })
          } else {
            if (!transformedValues) {
              debug(
                `No node named ${nodeName} could be found within the values object`
              )
              return null
            }
            const label = (transformedValues || {}).label || defaultLabel

            debug(
              `${nodeName}${label ? ` (${label})` : ''} was given a single value`
            )

            return createNode({
              label,
              idName,
              props: Object.assign({}, transformedValues)
            })
          }
        })
        .filter(exists)
    )

    // Get the Set of nodes that only appear within the relationships.
    const setOfEdgeNodesNotSeen = new Set(
      flatten(
        relationshipDotStatements
          .map(rs => {
            const edgesNodesNotSeenInNodes = rs.edge_list.map(
              e =>
                nodeDotStatements.find(nds => nds.node_id.id === e.id)
                  ? null
                  : e.id
            )

            return edgesNodesNotSeenInNodes
          })
          .filter(exists)
      )
    )

    const nodesFromEdgesStatements = flatten(
      Array.from(setOfEdgeNodesNotSeen)
        .map(nodeName => {
          const defaultLabel = nodeName || GENERIC_NODE_TYPE
          const idName = DEFAULT_ID_NAME

          const transform = nameToFunctionMap[nodeName] || property(nodeName)
          const transformedValues = transform(values)
          if (Array.isArray(transformedValues)) {
            debug(
              `${nodeName}${defaultLabel ? ` (${defaultLabel})` : ''} was given an array`
            )

            return transformedValues.map(tvs => {
              const label = tvs.label || defaultLabel
              return createNode({
                label,
                idName,
                props: tvs
              })
            })
          } else {
            if (!transformedValues) {
              debug(
                `No node named ${nodeName} could be found within the values object`
              )
              return null
            }

            const label = (transformedValues || {}).label || defaultLabel

            debug(
              `${nodeName}${label ? ` (${label})` : ''} was given a single value`
            )

            return createNode({
              label,
              idName,
              props: transformedValues
            })
          }
        })
        .filter(exists)
    )

    const edgeStatements = flatten(
      relationshipDotStatements.map(rs => {
        const type = toType(rs)
        const direction = toDirection(graph.type, rs)

        const nodes = rs.edge_list.map(e => e.id)
        const relationshipProps = toProps(rs)

        const nodeToProps = nodes
          .map(name => {
            const matchingNode = nodeDotStatements.find(
              nds => nds.node_id.id === name
            )

            if (matchingNode) {
              debug(
                'The node within the relationship has been defined so we get its details'
              )
              const nodeName = getNodeName(matchingNode)
              const defaultLabel = toLabel(matchingNode)
              const idName = toIdName(matchingNode)

              const transform = nameToFunctionMap[nodeName] ||
                property(nodeName)
              const transformedValues = transform(values)

              const hasNoNodeValues = !transformedValues ||
                (Array.isArray(transformedValues) &&
                  transformedValues.length === 0)
              if (hasNoNodeValues) {
                debug(
                  `No node named ${nodeName} required by the relationship ${nodes.join(' -> ')}
                   could be found within the values object`
                )
                return null
              }

              return {
                nodeName,
                defaultLabel,
                idName,
                props: Array.isArray(transformedValues)
                  ? transformedValues.map(tvs => Object.assign({}, tvs))
                  : Object.assign({}, transformedValues)
              }
            } else {
              debug(
                'The node within the relationship has not been defined so we fallback'
              )
              const nodeName = name
              const defaultLabel = name || GENERIC_NODE_TYPE
              const idName = DEFAULT_ID_NAME

              // If the relationship does not come with a matching node, then we are back to basics.
              const transform = nameToFunctionMap[nodeName] ||
                property(nodeName)
              const transformedValues = transform(values)

              const hasNoNodeValues = !transformedValues ||
                (Array.isArray(transformedValues) &&
                  transformedValues.length === 0)
              if (hasNoNodeValues) {
                debug(
                  `No node named ${nodeName} required by the relationship ${nodes.join(' -> ')}
                   could be found within the values object`
                )
                return null
              }

              return {
                nodeName,
                defaultLabel,
                idName,
                props: transformedValues
              }
            }
          })
          .filter(exists)

        if (nodeToProps.length < 2) {
          debug(
            `Found an invalid relationship ${nodes.join(' -> ')} with less than two nodes. This is possibly due to a node not existing within the values object.`
          )
          return
        }

        const relationships = []
        for (let i = 0; i < nodeToProps.length; i++) {
          const left = nodeToProps[i]
          const right = nodeToProps[i + 1]
          if (!left || !right) {
            break
          }

          const leftCount = Array.isArray(left.props) ? left.props.length : 1
          const rightCount = Array.isArray(right.props)
            ? right.props.length
            : 1
          // We will handle one-to-many or many-to-one, however we do not yet know how to handle
          // many-to-many (which will most likely require relationship attributes informing the edge creation)
          // so therefore we will throw an error if this is the case.
          if (leftCount > 1 && rightCount > 1) {
            throw new PoorlyDefinedRelationshipError(
              `Both left and the right relationships of ${nodes.join(' -> ')} are to
               multiple nodes (left: ${leftCount}, right: ${rightCount}).`
            )
          } else if (rightCount > 1) {
            debug(
              `The relationship (${nodes.join(' -> ')}) has a one-to-many relationship.`
            )
            const oneToManyRelationships = right.props.map(
              rightProp => createRelationship({
                left: {
                  id: left.props[left.idName],
                  label: left.props.label || left.defaultLabel,
                  idName: left.idName
                },
                right: {
                  id: rightProp[right.idName],
                  label: rightProp.label || right.defaultLabel,
                  idName: right.idName
                },
                type,
                direction,
                relationshipProps
              })
            )
            oneToManyRelationships.forEach(rel => relationships.push(rel))
          } else if (leftCount > 1) {
            debug(
              `The relationship (${nodes.join(' -> ')}) has a many-to-one relationship.`
            )
            const manyToOneRelationships = left.props.map(
              leftProp => createRelationship({
                left: {
                  id: leftProp[left.idName],
                  label: leftProp.label || left.defaultLabel,
                  idName: left.idName
                },
                right: {
                  id: right.props[right.idName],
                  label: right.props.label || right.defaultLabel,
                  idName: right.idName
                },
                type,
                direction,
                relationshipProps
              })
            )
            manyToOneRelationships.forEach(rel => relationships.push(rel))
          } else if (leftCount === 1 && rightCount === 1) {
            debug(
              `The relationship (${nodes.join(' -> ')}) has a one-to-one relationship.`
            )
            relationships.push(
              createRelationship({
                left: {
                  id: left.props[left.idName],
                  label: left.props.label || left.defaultLabel,
                  idName: left.idName
                },
                right: {
                  id: right.props[right.idName],
                  label: right.props.label || right.defaultLabel,
                  idName: right.idName
                },
                type,
                direction,
                relationshipProps
              })
            )
          }
        }

        return relationships
      })
    )

    debug(
      'combine the statements for nodes, nodes found only within edges, and edges'
    )
    return wrap(nodeStatements, nodesFromEdgesStatements, edgeStatements)
  }
}

module.exports = createToStatements
