# `graphviz-config-template` [![Build Status](https://travis-ci.org/sebinsua/graphviz-config-template.png)](https://travis-ci.org/sebinsua/graphviz-config-template) [![npm version](https://badge.fury.io/js/graphviz-config-template.svg)](https://www.npmjs.com/package/graphviz-config-template)
> :art: Templates as visual graph configuration.

**NOTE:** This is not finished, tested or published yet.

Describe the configuration of your graph using the [`dot`](https://en.wikipedia.org/wiki/DOT_(graph_description_language)) graph description language and get a `save` function in return that'll generate [Neo4j](https://neo4j.com/) Cypher queries when given some data.

The purpose of this is to experiment with visualising small [DSL](https://en.wikipedia.org/wiki/Domain-specific_language)s within the [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment).

A companion atom plugin [`atom-graphviz-config-template`](https://github.com/sebinsua/atom-graphviz-config-template) is [in development](https://github.com/sebinsua/graphviz-config-template/issues/1).

## Example

### ![Farm](./preview/farm.png)

```js
const graphConfig = require('graphviz-config-template')
const createCypherStream = require('cypher-stream')

const { digraph } = graphConfig();

const cypher = createCypherStream('bolt://localhost', 'username', 'password')
const transaction = cypher.transaction()

const farmer = { id: 1, name: 'Old McDonald' }
const farm = { id: 1, name: 'Animal Farm' }
const animal = { id: 1, name: 'Duck' }

transaction.write(
  digraph`farmer -> farm -> animal`({ farmer, farm, animal })
)
transaction.commit()
```

## Install

```sh
yarn add graphviz-config-template
```
