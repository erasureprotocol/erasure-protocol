# @ERASURE/GRAPH V3
## [Rinkeby Explorer](https://thegraph.com/explorer/subgraph/erasureprotocol/rinkeby-v130)
- Wrapper for erasure's the graph events 
```
    yarn add @erasure/graph
```
## USAGE
### Initiate client
```
const ErasureGraph = require("@erasure/graph")
const client = new ErasureGraph(opts)
```
-  Optional OPTS argument:
```
  {ipfsOpts:{host:"",post:"",protocol:""}, network:client.NETWORKS.rinkeby}
```
- If none is provided, infura ipfs will be provided

### RETRIEVE DATA OF EVENTS
```
const feed = await client.feeds({id})
const allFeeds = await client.feeds()
const first100Feeds = await client.feeds({count:100})
const feedsOfCreator = await client.feeds({creator:"0x1234..."})
```
### IPFS ACCESS
- Check if a hash is revealed
```
const isRevealed:boolean = await client.isRevealed(hash)
```
- Get data of a hash from ipfs
```
const data = await client.parseProofHash(hash)
```
### EVENTS AVAILABLE

- countdownGriefingEscrows
- instanceCreatedCountdownGriefingEscrowFactories
- cancelledCountdownGriefingEscrows
- dataSubmittedCountdownGriefingEscrows
- deadlineSetCountdownGriefingEscrows
- finalizedCountdownGriefingEscrows
- initializedCountdownGriefingEscrows
- lengthSetCountdownGriefingEscrows
- metadataSetCountdownGriefingEscrows
- operatorUpdatedCountdownGriefingEscrows
- paymentDepositedCountdownGriefingEscrows
- stakeDepositedCountdownGriefingEscrows
- stakeBurnedCountdownGriefingEscrows
- depositDecreasedCountdownGriefingEscrows
- depositIncreasedCountdownGriefingEscrows
- countdownGriefings
- instanceCreatedCountdownGriefingFactories
- initializedCountdownGriefings
- deadlineSetCountdownGriefings
- lengthSetCountdownGriefings
- ratioSetCountdownGriefings
- depositDecreasedCountdownGriefings
- depositIncreasedCountdownGriefings
- griefedCountdownGriefings
- operatorUpdatedCountdownGriefings
- metadataSetCountdownGriefings
- stakeAddedCountdownGriefings
- stakeTakenCountdownGriefings
- stakeBurnedCountdownGriefings
- simpleGriefings
- instanceCreatedSimpleGriefingFactories
- depositDecreasedSimpleGriefings
- depositIncreasedSimpleGriefings
- griefedSimpleGriefings
- initializedSimpleGriefings
- metadataSetSimpleGriefings
- operatorUpdatedSimpleGriefings
- ratioSetSimpleGriefings
- stakeAddedSimpleGriefings
- stakeBurnedSimpleGriefings
- feeds
- instanceCreatedFeedFactories
- hashSubmittedFeeds
- initializedFeeds
- operatorUpdatedFeeds
- metadataSetFeeds
- depositDecreasedFeeds
- depositIncreasedFeeds
