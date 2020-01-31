# ERASURE ABIS

- Contains abis and addresses for Erasure protocol contracts

### `yarn add @erasure/abis`

### USAGE

```
const {ErasureV1, ErasureV2, ErasureV3} = require("@erasure/abis")

const artifact = ErasureV3.{contractName}.artifact
const mainnetAddress = ErasureV3.{contractName}.mainnet
const rinkebyAddress = ErasureV3.{contractName}.rinkeby
const kovanAddress = ErasureV3.{contractName}.kovan
```

#### V1.1.0 Contracts:

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

#### V1.2.0 Contracts:

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

#### V1.3.0 Contracts:

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
- 