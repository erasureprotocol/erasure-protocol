# ERASURE ABIS

Contains abis and addresses for Erasure protocol contracts

### USAGE

`yarn add @erasure/abis`

```
const { ErasureV130 } = require("@erasure/abis")

const contractName = 'Erasure_Agreements'

const artifact = ErasureV130[contractName].artifact
const abi = ErasureV130[contractName].artifact.abi

const mainnetAddress = ErasureV130[contractName].mainnet
const rinkebyAddress = ErasureV130[contractName].rinkeby
const kovanAddress = ErasureV130[contractName].kovan
```

#### ErasureV130 Contracts

- NMR
- NMR_Uniswap
- DAI
- DAI_Uniswap
- UniswapFactory
- Authereum
- Erasure_Agreements
- Erasure_Posts
- Erasure_Users
- FeedFactory
- Feed
- SimpleGriefingFactory
- SimpleGriefing
- CountdownGriefingFactory
- CountdownGriefing
- CountdownGriefingEscrowFactory
- CountdownGriefingEscrow

#### ErasureV120 Contracts

- NMR
- Erasure_Agreements
- Erasure_Posts
- Erasure_Users
- FeedFactory
- Feed
- SimpleGriefingFactory
- SimpleGriefing
- CountdownGriefingFactory
- CountdownGriefing
- CountdownGriefingEscrowFactory
- CountdownGriefingEscrow

#### ErasureV110 Contracts

- NMR
- Erasure_Agreements
- Erasure_Posts
- Erasure_Users
- PostFactory
- Post
- FeedFactory
- Feed
- SimpleGriefingFactory
- SimpleGriefing
- CountdownGriefingFactory
- CountdownGriefing

#### ErasureV100 Contracts

- NMR
- Erasure_Agreements
- Erasure_Posts
- Erasure_Users
- PostFactory
- Post
- FeedFactory
- Feed
- OneWayGriefingFactory
- OneWayGriefing
