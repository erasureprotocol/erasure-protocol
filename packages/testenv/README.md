# Erasure Testenv

[![Build Status](https://github.com/erasureprotocol/erasure-protocol/workflows/CI/badge.svg)](https://github.com/erasureprotocol/erasure-protocol/actions)

Instantiate a ganache instance with NMR and erasure protocol.

### Deploy contracts to local ganache server

```
yarn
yarn compile
yarn deploy
```

### Deploy graphQL subgraph to local graph-node

In a new terminal

```
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
docker-compose up
```

In a new terminal

```
yarn deploy_subgraph
```

See this [graph protocol article](https://thegraph.com/docs/quick-start) for more info. A common troubleshooting step is to clear and resart the graph-node db by deleting the content of `graph-node/docker/data`.

To reset subgraph

```
yarn graph-remove-local
```
