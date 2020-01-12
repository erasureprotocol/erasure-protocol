import { InstanceCreated } from '../generated/CountdownGriefingEscrowFactory/CountdownGriefingEscrowFactory'
import {
  Cancelled,
  DataSubmitted,
  DeadlineSet,
  Finalized,
  Initialized,
  MetadataSet,
  OperatorUpdated,
  PaymentDeposited,
  StakeBurned,
  StakeDeposited,
  DepositDecreased,
  DepositIncreased,
  LengthSet
} from '../generated/templates/CountdownGriefingEscrow/CountdownGriefingEscrow'
import { CountdownGriefingEscrow as CountdownGriefingEscrowDataSource } from '../generated/templates'
import {
  CountdownGriefingEscrow,
  InstanceCreatedCountdownGriefingEscrowFactory,
  CancelledCountdownGriefingEscrow,
  DataSubmittedCountdownGriefingEscrow,
  DeadlineSetCountdownGriefingEscrow,
  FinalizedCountdownGriefingEscrow,
  InitializedCountdownGriefingEscrow,
  MetadataSetCountdownGriefingEscrow,
  OperatorUpdatedCountdownGriefingEscrow,
  PaymentDepositedCountdownGriefingEscrow,
  StakeDepositedCountdownGriefingEscrow,
  StakeBurnedCountdownGriefingEscrow,
  DepositDecreasedCountdownGriefingEscrow,
  DepositIncreasedCountdownGriefingEscrow,
  LengthSetCountdownGriefingEscrow
} from '../generated/schema'

export function handleInstanceCreated(event: InstanceCreated): void {
  let entity = new InstanceCreatedCountdownGriefingEscrowFactory(
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

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.params.instance.toHex(),
  )
  countdownGriefingEscrow.creator = event.params.creator
  countdownGriefingEscrow.initCallData = event.params.callData
  countdownGriefingEscrow.createdTimestamp = entity.timestamp
  countdownGriefingEscrow.finalized = false
  countdownGriefingEscrow.cancelled = false
  countdownGriefingEscrow.dataSubmitted = false
  countdownGriefingEscrow.save()

  CountdownGriefingEscrowDataSource.create(event.params.instance)
}

export function handleCancelled(event: Cancelled): void {
  let entity = new CancelledCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.address.toHex(),
  )
  countdownGriefingEscrow.cancelled = true
  countdownGriefingEscrow.save()
}

export function handleDataSubmitted(event: DataSubmitted): void {
  let entity = new DataSubmittedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.data = event.params.data
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.address.toHex(),
  )
  countdownGriefingEscrow.dataSubmitted = true
  countdownGriefingEscrow.data = entity.data
  countdownGriefingEscrow.dataB58 = entity.data.toBase58()
  countdownGriefingEscrow.save()
}

export function handleDeadlineSet(event: DeadlineSet): void {
  let entity = new DeadlineSetCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.deadline = event.params.deadline
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefing.deadline = entity.deadline
  countdownGriefing.save()
}

export function handleDepositDecreased(event: DepositDecreased):void{
  let entity = new DepositDecreasedCountdownGriefingEscrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
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
  let entity = new DepositIncreasedCountdownGriefingEscrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
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
export function handleFinalized(event: Finalized): void {
  let entity = new FinalizedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.agreement = event.params.agreement
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.address.toHex(),
  )
  countdownGriefingEscrow.countdownGriefingAgreement = entity.agreement.toHex()
  countdownGriefingEscrow.finalized = true
  countdownGriefingEscrow.save()
}

export function handleInitialized(event: Initialized): void {
  let entity = new InitializedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.buyer = event.params.buyer
  entity.seller = event.params.seller
  entity.tokenID = event.params.tokenID
  entity.paymentAmount = event.params.paymentAmount
  entity.stakeAmount = event.params.stakeAmount
  entity.countdownLength = event.params.countdownLength
  entity.metadata = event.params.metadata
  entity.metadataB58 = event.params.metadata.toBase58()
  entity.agreementParams = event.params.agreementParams
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.address.toHex(),
  )
  countdownGriefingEscrow.buyer = entity.buyer
  countdownGriefingEscrow.seller = entity.seller
  countdownGriefingEscrow.tokenID = entity.tokenID
  countdownGriefingEscrow.paymentAmount = entity.paymentAmount
  countdownGriefingEscrow.stakeAmount = entity.stakeAmount
  countdownGriefingEscrow.countdownLength = entity.countdownLength
  countdownGriefingEscrow.initMetadata = entity.metadata
  countdownGriefingEscrow.initMetadataB58 = entity.metadataB58
  countdownGriefingEscrow.agreementParams = entity.agreementParams
  countdownGriefingEscrow.save()
}

export function handleLengthSet(event:LengthSet):void{
  let entity = new LengthSetCountdownGriefingEscrow(event.transaction.hash.toHex() + '-' + event.logIndex.toString(),)
   entity.contract = event.address
    entity.length = event.params.length
    entity.blockNumber = event.block.number
    entity.timestamp = event.block.timestamp
    entity.txHash = event.transaction.hash
    entity.logIndex = event.logIndex
    entity.save()
     let countdownGriefing = new CountdownGriefingEscrow(event.address.toHex())
      countdownGriefing.length = entity.length
      countdownGriefing.save()
}
export function handleMetadataSet(event: MetadataSet): void {
  let entity = new MetadataSetCountdownGriefingEscrow(
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

  let countdownGriefing = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefing.metadata = entity.metadata
  countdownGriefing.metadataB58 = entity.metadataB58
  countdownGriefing.save()
}

export function handleOperatorUpdated(event: OperatorUpdated): void {
  let entity = new OperatorUpdatedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.operator = event.params.operator
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefing = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefing.operator = entity.operator
  countdownGriefing.save()
}

export function handlePaymentDeposited(event: PaymentDeposited): void {
  let entity = new PaymentDepositedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.buyer = event.params.buyer
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(
    event.address.toHex(),
  )
  countdownGriefingEscrow.buyer = entity.buyer
  countdownGriefingEscrow.paymentDeposited = true
  countdownGriefingEscrow.save()
}


export function handleStakeBurned(event: StakeBurned):void{
  let entity = new StakeBurnedCountdownGriefingEscrow(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString(),
  )
  entity.contract = event.address
  entity.staker = event.params.staker
  entity.tokenID = event.params.tokenID
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}