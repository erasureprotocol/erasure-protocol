# Erasure GraphQL API

This is the code for our subgraph running on [The Graph](https://thegraph.com/). This subgraph provides a GraphQL API for querying all the data of the Erasure protocol.

The semantic versioning follows versioning of the protocol. As such, an application will need to query separate endpoints if they wish to query across multiple versions of the protocol.

This subgraph only works with a full archive node with tracing, so the best way to develop and test is by deploying to the hosted service. Follow The Graph's [docs](https://thegraph.com/docs/deploy-a-subgraph#deploy-the-subgraph) to find out how to deploy a subgraph to their hosted service.

## Setup Access token

In order to deploy, you must have an access token setup. Go to https://thegraph.com/explorer/dashboard?account=erasureprotocol and copy the Access Token from there, then run:

```
export GRAPH_ACCESS_TOKEN=...
```

### Erasure Graph Explorers :

- [Rinkeby V1.2.0](https://thegraph.com/explorer/subgraph/erasureprotocol/rinkeby-v120)
- [Mainnet V1.2.0](https://thegraph.com/explorer/subgraph/erasureprotocol/v120)
- [Rinkeby V1.3.0](https://thegraph.com/explorer/subgraph/erasureprotocol/rinkeby-v130)
- [Kovan V1.3.0](https://thegraph.com/explorer/subgraph/erasureprotocol/kovan-v130)
- [Mainnet V1.3.0](https://thegraph.com/explorer/subgraph/erasureprotocol/v130)
