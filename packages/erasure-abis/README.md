# ERASURE ABIS
- Contains abis and addresses for Erasure protocol contracts
```yarn add @erasure/abis```
## USAGE
### V1.1.0
```
const {ErasureV1} = require("@erasure/abis")
const artifact = ErasureV1.{contractName}.artifact
const mainnetAddress = ErasureV1.{contractName}.mainnetAddress
const rinkebyAddress = ErasureV1.{contractName}.rinkebyAddress
```
#### Contracts:
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


