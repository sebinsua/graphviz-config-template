// Ensure that we are not sending arrays, undefined or objects into Neo4j.
const cleanProperties = obj => {
  const newObj = Object.assign({}, obj);
  Object.keys(obj).forEach(key => {
    if (typeof newObj[key] === 'undefined') {
      delete newObj[key];
    } else if (Array.isArray(newObj[key]) || typeof newObj[key] === 'object') {
      newObj[key] = JSON.stringify(newObj[key]);
    }
  });
  return newObj;
};

const matchNode = (node, label, idName, paramName) => {
  paramName = paramName || idName;
  const labels = label ? `:${Array.isArray(label) ? label.join(':'): label}` : '';
  return `(${node}${labels} { ${idName}: {${paramName}} })`
};

function createNodeStatement ({
  label,
  props = {},
  idName = 'id'
}) {
  if (!props[idName]) {
    throw new Error(`The id field '${idName}' cannot be found within the props of the Node labelled '${label}'.`)
  }

  const remainingProps = Object.assign({}, props);
  delete remainingProps[idName];

  const nodeName = 'n';
  return {
    statement: `MERGE ${matchNode(nodeName, label, idName)} SET ${nodeName} += $remainingProps`,
    parameters: { [idName]: props[idName], remainingProps: cleanProperties(remainingProps) }
  };
}

module.exports = createNodeStatement;
module.exports.matchNode = matchNode;
