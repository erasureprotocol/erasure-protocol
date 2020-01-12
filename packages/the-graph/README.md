# Erasure GraphQL API

This is the code for our subgraph running on [The Graph](https://thegraph.com/). This subgraph provides a GraphQL API for querying all the data of the Erasure protocol.

The semantic versioning follows versioning of the protocol. As such, an application will need to query separate endpoints if they wish to query across multiple versions of the protocol.

This subgraph only works with a full archive node with tracing, so the best way to develop and test is by deploying to the hosted service. Follow The Graph's [docs](https://thegraph.com/docs/deploy-a-subgraph#deploy-the-subgraph) to find out how to deploy a subgraph to their hosted service.


#V1.3.0
- Include scripts to codegen-build-deploy for Rinkeby, Kovan and Mainnet
