# Erasure GraphQL API v1.0.x

This subgraph only works with a full archive node with tracing, so the best way to develop and test is by deploying to the hosted service. Follow The Graph's [docs](https://thegraph.com/docs/deploy-a-subgraph#deploy-the-subgraph) to find out how to deploy a subgraph to their hosted service.

[Online Explorer](https://thegraph.com/explorer/subgraph/jgeary/erasure).

OneWayGriefing agreements will not include a `staker` or `counterparty` if they were created using [`OneWayGriefing_Factory.create()`](https://github.com/erasureprotocol/erasure-protocol/blob/v1.0.0/contracts/agreements/OneWayGriefing_Factory.sol#L22) instead of [`OneWayGriefing_Factory.createEncoded()`](https://github.com/erasureprotocol/erasure-protocol/blob/v1.0.0/contracts/agreements/OneWayGriefing_Factory.sol#L27) or [`OneWayGriefing_Factory.createExplicit()`](https://github.com/erasureprotocol/erasure-protocol/blob/v1.0.0/contracts/agreements/OneWayGriefing_Factory.sol#L44).
