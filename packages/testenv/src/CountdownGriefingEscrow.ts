import { InstanceCreated } from "../generated/CountdownGriefingEscrowFactory/CountdownGriefingEscrowFactory"
import {
  Cancelled,
  DataSubmitted,
  DeadlineSet,
  Finalized,
  Initialized,
  MetadataSet,
  OperatorUpdated,
  PaymentDeposited,
  StakeDeposited
} from "../generated/templates/CountdownGriefingEscrow/CountdownGriefingEscrow"
import { CountdownGriefingEscrow as CountdownGriefingEscrowDataSource } from "../generated/templates"
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
  StakeDepositedCountdownGriefingEscrow
} from "../generated/schema"

export function handleInstanceCreated(event: InstanceCreated): void {
  let entity = new InstanceCreatedCountdownGriefingEscrowFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.params.instance.toHex())
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
  let entity = new CancelledCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.cancelled = true
  countdownGriefingEscrow.save()
}

export function handleDataSubmitted(event: DataSubmitted): void {
  let entity = new DataSubmittedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.data = event.params.data
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.dataSubmitted = true
  countdownGriefingEscrow.data = entity.data
  countdownGriefingEscrow.dataB58 = entity.data.toBase58()
  countdownGriefingEscrow.save()
}

export function handleDeadlineSet(event: DeadlineSet): void {
  let entity = new DeadlineSetCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
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

export function handleFinalized(event: Finalized): void {
  let entity = new FinalizedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.agreement = event.params.agreement
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.countdownGriefingAgreement = entity.agreement.toHex()
  countdownGriefingEscrow.finalized = true
  countdownGriefingEscrow.save()
}

export function handleInitialized(event: Initialized): void {
  let entity = new InitializedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.operator = event.params.operator
  entity.buyer = event.params.buyer
  entity.seller = event.params.seller
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

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.buyer = entity.buyer
  countdownGriefingEscrow.seller = entity.seller
  countdownGriefingEscrow.paymentAmount = entity.paymentAmount
  countdownGriefingEscrow.stakeAmount = entity.stakeAmount
  countdownGriefingEscrow.countdownLength = entity.countdownLength
  countdownGriefingEscrow.initMetadata = entity.metadata
  countdownGriefingEscrow.initMetadataB58 = entity.metadataB58
  countdownGriefingEscrow.agreementParams =  entity.agreementParams
  countdownGriefingEscrow.save()
}

export function handleMetadataSet(event: MetadataSet): void {
  let entity = new MetadataSetCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
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
  let entity = new OperatorUpdatedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
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
  let entity = new PaymentDepositedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.buyer = event.params.buyer
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.buyer = entity.buyer
  countdownGriefingEscrow.paymentDeposited = true
  countdownGriefingEscrow.save()
}

export function handleStakeDeposited(event: StakeDeposited): void {
  let entity = new StakeDepositedCountdownGriefingEscrow(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.seller = event.params.seller
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let countdownGriefingEscrow = new CountdownGriefingEscrow(event.address.toHex())
  countdownGriefingEscrow.seller = entity.seller
  countdownGriefingEscrow.stakeDeposited = true
  countdownGriefingEscrow.save()
}
