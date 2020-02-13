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

- `iNMR`
- `iRegistry`
- `iFactory`
- `iUniswapFactory`
- `iUniswapExchange`
- `iAuthereumAccount`
- `NMR`
- `NMR_Uniswap`
- `DAI`
- `DAI_Uniswap`
- `RegistryManager`
- `Erasure_Posts`
- `Erasure_Agreements`
- `Erasure_Escrows`
- `Erasure_Users`
- `Feed_Factory`
- `Feed`
- `SimpleGriefing_Factory`
- `SimpleGriefing`
- `CountdownGriefing_Factory`
- `CountdownGriefing`
- `CountdownGriefingEscrow_Factory`
- `CountdownGriefingEscrow`

#### ErasureV120 Contracts

- `iNMR`
- `iRegistry`
- `iFactory`
- `NMR`
- `Erasure_Posts`
- `Erasure_Agreements`
- `Erasure_Escrows`
- `Erasure_Users`
- `Feed_Factory`
- `Feed`
- `SimpleGriefing_Factory`
- `SimpleGriefing`
- `CountdownGriefing_Factory`
- `CountdownGriefing`
- `CountdownGriefingEscrow_Factory`
- `CountdownGriefingEscrow`

#### ErasureV110 Contracts

- `iNMR`
- `iRegistry`
- `iFactory`
- `NMR`
- `Erasure_Posts`
- `Erasure_Agreements`
- `Erasure_Users`
- `Post_Factory`
- `Post`
- `Feed_Factory`
- `Feed`
- `SimpleGriefing_Factory`
- `SimpleGriefing`
- `CountdownGriefing_Factory`
- `CountdownGriefing`

#### ErasureV100 Contracts

- `iNMR`
- `iRegistry`
- `iFactory`
- `NMR`
- `Erasure_Posts`
- `Erasure_Agreements`
- `Erasure_Users`
- `Post_Factory`
- `Post`
- `Feed_Factory`
- `Feed`
- `OneWayGriefing_Factory`
- `OneWayGriefing`
