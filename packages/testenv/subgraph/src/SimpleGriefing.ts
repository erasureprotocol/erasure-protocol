import { BigInt } from "@graphprotocol/graph-ts"
import { InstanceCreated } from "../generated/SimpleGriefingFactory/SimpleGriefingFactory"
import {
  Griefed,
  Initialized,
  MetadataSet,
  OperatorUpdated,
  RatioSet,
  StakeAdded,
  StakeBurned,
  StakeTaken
} from "../generated/templates/SimpleGriefing/SimpleGriefing"
import { SimpleGriefing as SimpleGriefingDataSource } from "../generated/templates"
import {
  SimpleGriefing,
  GriefedSimpleGriefing,
  InitializedSimpleGriefing,
  MetadataSetSimpleGriefing,
  OperatorUpdatedSimpleGriefing,
  RatioSetSimpleGriefing,
  StakeAddedSimpleGriefing,
  StakeBurnedSimpleGriefing,
  StakeTakenSimpleGriefing,
  InstanceCreatedSimpleGriefingFactory
} from "../generated/schema"

export function handleInstanceCreated(event: InstanceCreated): void {
  let entity = new InstanceCreatedSimpleGriefingFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let simpleGrifing = new SimpleGriefing(entity.instance.toHex())
  simpleGrifing.creator = entity.creator
  simpleGrifing.initCallData = entity.callData
  simpleGrifing.createdTimestamp = entity.timestamp
  simpleGrifing.save()

  SimpleGriefingDataSource.create(event.params.instance)
}

export function handleGriefed(event: Griefed): void {
  let entity = new GriefedSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.punisher = event.params.punisher
  entity.staker = event.params.staker
  entity.punishment = event.params.punishment
  entity.cost = event.params.cost
  entity.message = event.params.message
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleInitialized(event: Initialized): void {
  let entity = new InitializedSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.operator = event.params.operator
  entity.staker = event.params.staker
  entity.counterparty = event.params.counterparty
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let simpleGrifing = new SimpleGriefing(event.address.toHex())
  simpleGrifing.staker = entity.staker
  simpleGrifing.counterparty = entity.counterparty
  simpleGrifing.ratio = entity.ratio
  simpleGrifing.ratioType = entity.ratioType
  simpleGrifing.initMetadata = entity.metadata
  simpleGrifing.initMetadataB58 = entity.metadataB58
  simpleGrifing.currentStake = BigInt.fromI32(0)
  simpleGrifing.totalBurned = BigInt.fromI32(0)
  simpleGrifing.totalTaken = BigInt.fromI32(0)
  simpleGrifing.save()
}

export function handleMetadataSet(event: MetadataSet): void {
  let entity = new MetadataSetSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new SimpleGriefing(event.address.toHex())
  countdownGriefing.metadata = entity.metadata
  countdownGriefing.metadataB58 = entity.metadataB58
  countdownGriefing.save()
}

export function handleOperatorUpdated(event: OperatorUpdated): void {
  let entity = new OperatorUpdatedSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.operator = event.params.operator
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new SimpleGriefing(event.address.toHex())
  countdownGriefing.operator = entity.operator
  countdownGriefing.save()
}

export function handleRatioSet(event: RatioSet): void {
  let entity = new RatioSetSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.staker = event.params.staker
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleStakeAdded(event: StakeAdded): void {
  let entity = new StakeAddedSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.staker = event.params.staker
  entity.funder = event.params.funder
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new SimpleGriefing(event.address.toHex())
  countdownGriefing.currentStake = countdownGriefing.currentStake.plus(entity.amount)
  countdownGriefing.save()
}

export function handleStakeBurned(event: StakeBurned): void {
  let entity = new StakeBurnedSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new SimpleGriefing(event.address.toHex())
  countdownGriefing.currentStake = countdownGriefing.currentStake.minus(entity.amount)
  countdownGriefing.totalBurned = countdownGriefing.totalBurned.plus(entity.amount)
  countdownGriefing.save()
}

export function handleStakeTaken(event: StakeTaken): void {
  let entity = new StakeTakenSimpleGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.staker = event.params.staker
  entity.recipient = event.params.recipient
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new SimpleGriefing(event.address.toHex())
  countdownGriefing.currentStake = countdownGriefing.currentStake.minus(entity.amount)
  countdownGriefing.totalTaken = countdownGriefing.totalTaken.plus(entity.amount)
  countdownGriefing.save()
}
