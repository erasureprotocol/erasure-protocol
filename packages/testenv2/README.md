# Erasure Testenv

[![Build Status](https://github.com/erasureprotocol/erasure-protocol/workflows/CI/badge.svg)](https://github.com/erasureprotocol/erasure-protocol/actions)

Instantiate a ganache instance with NMR and erasure protocol.

### Deploy contracts to local ganache server using node

```
yarn
yarn deploy
```

### Deploy contracts to local ganache server using docker

```
docker run --publish 8545:8545 --name erasure thegostep/testenv:1.0
```
