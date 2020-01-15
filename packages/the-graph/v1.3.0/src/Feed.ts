import { ByteArray, Bytes } from '@graphprotocol/graph-ts'
import { InstanceCreated } from '../generated/FeedFactory/FeedFactory'
import {
  Initialized,
  HashSubmitted,
  DepositDecreased,
  DepositIncreased,
  OperatorUpdated,
  MetadataSet,
    DepositDecreased,
    DepositIncreased
} from '../generated/templates/Feed/Feed'
import { Feed as FeedDataSource } from '../generated/templates'
import {
  Feed,
  InstanceCreatedFeedFactory,
  InitializedFeed,
  HashSubmittedFeed,
  OperatorUpdatedFeed,
  MetadataSetFeed,
  DepositDecreasedFeed,
  DepositIncreasedFeed
} from '../generated/schema'

function addQm(a: ByteArray): ByteArray {
  let out = new Uint8Array(34)
  out[0] = 0x12
  out[1] = 0x20
  for (let i = 0; i < 32; i++) {
    out[i + 2] = a[i]
  }
  return out as ByteArray
}

export function handleInstanceCreated(event: InstanceCreated): void {
  let entity = new InstanceCreatedFeedFactory(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.params.instance.toHex())
  feed.creator = entity.creator
  feed.initCallData = entity.callData
  feed.createdTimestamp = entity.timestamp
  feed.save()

  FeedDataSource.create(event.params.instance)
}

export function handleInitialized(event: Initialized): void {
  let entity = new InitializedFeed(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  feed.initMetadata = entity.metadata
  feed.initMetadataB58 = entity.metadataB58
  feed.save()
}

export function handleHashSubmitted(event: HashSubmitted): void {
  let entity = new HashSubmittedFeed(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.hash = event.params.hash
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
  let feed = Feed.load(event.address.toHex())
  if(feed==null){
    feed = new Feed(event.address.toHex())
    feed.hashes=[]
    feed.hashes.push(addQm(event.params.hash) as Bytes)
  }
  else{
    let hashes = feed.hashes
    hashes.push(addQm(event.params.hash) as Bytes)
    feed.hashes = hashes
  }
  feed.save()
}

export function handleDepositDecreased(event: DepositDecreased):void{
  let entity = new DepositDecreasedFeed(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.contract = event.address
  entity.tokenID = event.params.tokenID
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.newDeposit = event.params.newDeposit
   entity.blockNumber = event.block.number
    entity.timestamp = event.block.timestamp
    entity.txHash = event.transaction.hash
    entity.logIndex = event.logIndex
   entity.save()
}

export function handleDepositIncreased(event: DepositDecreased):void{
  let entity = new DepositDecreasedFeed(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.contract = event.address
  entity.tokenID = event.params.tokenID
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.newDeposit = event.params.newDeposit
   entity.blockNumber = event.block.number
    entity.timestamp = event.block.timestamp
    entity.txHash = event.transaction.hash
    entity.logIndex = event.logIndex
   entity.save()
}

export function handleOperatorUpdated(event: OperatorUpdated): void {
  let entity = new OperatorUpdatedFeed(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  feed.operator = entity.operator
  feed.save()
}

export function handleMetadataSet(event: MetadataSet): void {
  let entity = new MetadataSetFeed(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  feed.metadata = entity.metadata
  feed.metadataB58 = entity.metadataB58
  feed.save()
}
