# ERASURE ABIS

- Contains abis and addresses for Erasure protocol contracts

### `yarn add @erasure/abis`

### USAGE

```
const {ErasureV1, ErasureV2, ErasureV3} = require("@erasure/abis")

const abi = ErasureV1.{contractName}.artifact
const mainnetAddress = ErasureV1.{contractName}.mainnetAddress
const rinkebyAddress = ErasureV1.{contractName}.rinkebyAddress
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


##### V3 bytecode : 

```aidl
const bytecode = ErasureV3.{contractName}.bytecode
const contractObj = ErasureV3.{contractName}.contractObj (for testenv)
```
