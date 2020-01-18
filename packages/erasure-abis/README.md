# ERASURE ABIS
- Contains abis and addresses for Erasure protocol contracts
```yarn add @erasure/abis```
### USAGE
```
const {ErasureV1,ErasureV2} = require("@erasure/abis")

const artifact = ErasureV1.{contractName}.artifact
const mainnetAddress = ErasureV1.{contractName}.mainnetAdd
const rinkebyAddress = ErasureV1.{contractName}.rinkebyAdd
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

