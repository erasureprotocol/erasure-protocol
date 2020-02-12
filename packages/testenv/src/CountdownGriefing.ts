import { BigInt } from '@graphprotocol/graph-ts'
import { InstanceCreated } from '../generated/CountdownGriefingFactory/CountdownGriefingFactory'
import {
  Initialized,
  RatioSet,
  Griefed,
  LengthSet,
  OperatorUpdated,
  MetadataSet,
  StakeBurned,
  DeadlineSet,
  LengthSet
} from '../generated/templates/CountdownGriefing/CountdownGriefing'
import { CountdownGriefing as CountdownGriefingDataSource } from '../generated/templates'
import {
  CountdownGriefing,
  InstanceCreatedCountdownGriefingFactory,
  InitializedCountdownGriefing,
  RatioSetCountdownGriefing,
  GriefedCountdownGriefing,
  LengthSetCountdownGriefing,
  OperatorUpdatedCountdownGriefing,
  MetadataSetCountdownGriefing,
  StakeBurnedCountdownGriefing,
  DeadlineSetCountdownGriefing,
} from '../generated/schema'

export function handleInstanceCreated(event: InstanceCreated): void {
  let entity = new InstanceCreatedCountdownGriefingFactory(
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

  let countdownGriefing = new CountdownGriefing(entity.instance.toHex())
  countdownGriefing.creator = entity.creator
  countdownGriefing.initCallData = entity.callData
  countdownGriefing.createdTimestamp = entity.timestamp
  countdownGriefing.save()

  CountdownGriefingDataSource.create(event.params.instance)
}

export function handleInitialized(event: Initialized): void {
  let entity = new InitializedCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.staker = event.params.staker
  entity.counterparty = event.params.counterparty
  entity.tokenID = event.params.tokenID
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.countdownLength = event.params.countdownLength
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefing(event.address.toHex())
  countdownGriefing.staker = entity.staker
  countdownGriefing.counterparty = entity.counterparty
  countdownGriefing.tokenID = entity.tokenID
  countdownGriefing.ratio = entity.ratio
  countdownGriefing.ratioType = entity.ratioType
  countdownGriefing.countdownLength = entity.countdownLength
  countdownGriefing.initMetadata = entity.metadata
  countdownGriefing.initMetadataB58 = entity.metadataB58
  countdownGriefing.currentStake = BigInt.fromI32(0)
  countdownGriefing.totalBurned = BigInt.fromI32(0)
  countdownGriefing.totalTaken = BigInt.fromI32(0)
  countdownGriefing.save()
}
export function handleLengthSet(event:LengthSet):void{
  let entity = new LengthSetCountdownGriefing(event.transaction.hash.toHex() + '-' + event.logIndex.toString(),)
   entity.contract = event.address
    entity.length = event.params.length
    entity.blockNumber = event.block.number
    entity.timestamp = event.block.timestamp
    entity.txHash = event.transaction.hash
    entity.logIndex = event.logIndex
    entity.save()
     let countdownGriefing = new CountdownGriefing(event.address.toHex())
      countdownGriefing.length = entity.length
      countdownGriefing.save()
}
export function handleRatioSet(event: RatioSet): void {
  let entity = new RatioSetCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.staker = event.params.staker
  entity.tokenID = event.params.tokenID
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleGriefed(event: Griefed): void {
  let entity = new GriefedCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
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


export function handleOperatorUpdated(event: OperatorUpdated): void {
  let entity = new OperatorUpdatedCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefing(event.address.toHex())
  countdownGriefing.operator = entity.operator
  countdownGriefing.save()
}

export function handleMetadataSet(event: MetadataSet): void {
  let entity = new MetadataSetCountdownGriefing(
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

  let countdownGriefing = new CountdownGriefing(event.address.toHex())
  countdownGriefing.metadata = entity.metadata
  countdownGriefing.initMetadataB58 = entity.metadataB58
  countdownGriefing.save()
}

export function handleStakeBurned(event: StakeBurned): void {
  let entity = new StakeBurnedCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.tokenID = event.params.tokenID
  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefing(event.address.toHex())
  countdownGriefing.currentStake = countdownGriefing.currentStake.minus(
    entity.amount,
  )
  countdownGriefing.totalBurned = countdownGriefing.totalBurned.plus(
    entity.amount,
  )
  countdownGriefing.save()
}

export function handleDeadlineSet(event: DeadlineSet): void {
  let entity = new DeadlineSetCountdownGriefing(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.deadline = event.params.deadline
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefing(event.address.toHex())
  countdownGriefing.deadline = entity.deadline
  countdownGriefing.save()
}
