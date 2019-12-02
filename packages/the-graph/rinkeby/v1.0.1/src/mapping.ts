import {
  ExplicitInitData as ExplicitInitDataFeedFactoryEvent,
  InstanceCreated as InstanceCreatedFeedFactoryEvent
} from "../generated/FeedFactory/FeedFactory"
import {
  Feed as FeedContract,
  PostCreated as PostCreatedFeedEvent,
  VariableMetadataSet as VariableMetadataSetFeedEvent,
  StaticMetadataSet as StaticMetadataSetFeedEvent,
  OperatorUpdated as OperatorUpdatedFeedEvent
} from "../generated/templates/Feed/Feed"
import {
  ExplicitInitData as ExplicitInitDataPostFactoryEvent,
  InstanceCreated as InstanceCreatedPostFactoryEvent
} from "../generated/PostFactory/PostFactory"
import {
  Created as PostCreatedPostEvent,
  VariableMetadataSet as VariableMetadataSetPostEvent,
  StaticMetadataSet as StaticMetadataSetPostEvent,
  ProofHashSet as ProofHashSetPostEvent,
  OperatorUpdated as OperatorUpdatedPostEvent
} from "../generated/templates/Post/Post"
import {
  ExplicitInitData as ExplicitInitDataOneWayGriefingFactoryEvent,
  InstanceCreated as InstanceCreatedOneWayGriefingFactoryEvent
} from "../generated/OneWayGriefingFactory/OneWayGriefingFactory"
import {
  VariableMetadataSet as VariableMetadataSetOneWayGriefingEvent,
  StaticMetadataSet as StaticMetadataSetOneWayGriefingEvent,
  RatioSet as RatioSetOneWayGriefingEvent,
  OperatorUpdated as OperatorUpdatedOneWayGriefingEvent,
  Griefed as GriefedOneWayGriefingEvent,
  TokenSet as TokenSetOneWayGriefingEvent,
  StakeAdded as StakeAddedOneWayGriefingEvent,
  StakeTaken as StakeTakenOneWayGriefingEvent,
  StakeBurned as StakeBurnedOneWayGriefingEvent,
  LengthSet as LengthSetOneWayGriefingEvent,
  DeadlineSet as DeadlineSetOneWayGriefingEvent
} from "../generated/templates/OneWayGriefing/OneWayGriefing"
import {
  Feed as FeedDataSource,
  Post as PostDataSource,
  OneWayGriefing as OneWayGriefingDataSource
} from "../generated/templates"
import {
  Feed,
  ExplicitInitDataFeedFactory,
  InstanceCreatedFeedFactory,
  PostCreatedFeed,
  VariableMetadataSetFeed,
  StaticMetadataSetFeed,
  OperatorUpdatedFeed,
  Post,
  ExplicitInitDataPostFactory,
  InstanceCreatedPostFactory,
  PostCreatedPost,
  VariableMetadataSetPost,
  StaticMetadataSetPost,
  OperatorUpdatedPost,
  ProofHashSetPost,
  OneWayGriefingAgreement,
  InstanceCreatedOneWayGriefingFactory,
  ExplicitInitDataOneWayGriefingFactory,
  VariableMetadataSetOneWayGriefing,
  StaticMetadataSetOneWayGriefing,
  OperatorUpdatedOneWayGriefing,
  RatioSetOneWayGriefing,
  GriefedOneWayGriefing,
  TokenSetOneWayGriefing,
  StakeAddedOneWayGriefing,
  StakeTakenOneWayGriefing,
  StakeBurnedOneWayGriefing,
  LengthSetOneWayGriefing,
  DeadlineSetOneWayGriefing
} from "../generated/schema"

export function handleExplicitInitDataFeedFactory(event: ExplicitInitDataFeedFactoryEvent): void {
  let entity = new ExplicitInitDataFeedFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.operator = event.params.operator
  entity.postRegistry = event.params.postRegistry
  entity.staticMetadata = event.params.feedStaticMetadata
  entity.staticMetadataB58 = event.params.feedStaticMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleInstanceCreatedFeedFactory(event: InstanceCreatedFeedFactoryEvent): void {
  let entity = new InstanceCreatedFeedFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.params.instance.toHex())
  feed.creator = entity.creator
  feed.createdTimestamp = entity.timestamp
  feed.initCallData = entity.callData
  feed.save()

  FeedDataSource.create(event.params.instance)
}

export function handleVariableMetadataSetFeed(event: VariableMetadataSetFeedEvent): void {
  let entity = new VariableMetadataSetFeed(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.variableMetadata = event.params.variableMetadata
  entity.variableMetadataB58 = event.params.variableMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  feed.variableMetadata = entity.variableMetadata
  feed.variableMetadataB58 = entity.variableMetadataB58
  feed.save()
}

export function handleStaticMetadataSetFeed(event: StaticMetadataSetFeedEvent): void {
  let entity = new StaticMetadataSetFeed(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  let feedContract = FeedContract.bind(event.address)
  feed.postRegistry = feedContract.getPostRegistry()
  feed.staticMetadata = entity.staticMetadata
  feed.staticMetadataB58 = entity.staticMetadataB58
  feed.save()
}

export function handleOperatorUpdatedFeed(event: OperatorUpdatedFeedEvent): void {
  let entity = new OperatorUpdatedFeed(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.operator = event.params.operator
  entity.status = event.params.status
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let feed = new Feed(event.address.toHex())
  feed.operator = entity.operator
  feed.operatorStatus = entity.status
  feed.save()
}

export function handlePostCreatedFeed(event: PostCreatedFeedEvent): void {
  let entity = new PostCreatedFeed(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.post = event.params.post
  entity.postFactory = event.params.postFactory
  entity.initData = event.params.initData
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let post = new Post(event.params.post.toHex())
  post.feed = event.address.toHex()
  post.save()

  let feed = Feed.load(event.address.toHex())
  let feedPosts = feed.posts || []
  feedPosts.push(event.params.post.toHex())
  feed.posts = feedPosts
  feed.save()
}

export function handleExplicitInitDataPostFactory(event: ExplicitInitDataPostFactoryEvent): void {
  let entity = new ExplicitInitDataPostFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.operator = event.params.operator
  entity.proofHash = event.params.proofHash
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.variableMetadata = event.params.variableMetadata
  entity.variableMetadataB58 = event.params.variableMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleInstanceCreatedPostFactory(event: InstanceCreatedPostFactoryEvent): void {
  let entity = new InstanceCreatedPostFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let post = new Post(event.params.instance.toHex())
  post.creator = entity.creator
  post.createdTimestamp = entity.timestamp
  post.initCallData = entity.callData
  post.save()

  PostDataSource.create(event.params.instance)
}

export function handlePostCreatedPost(event: PostCreatedPostEvent): void {
  let entity = new PostCreatedPost(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.operator = event.params.operator
  entity.proofHash = event.params.proofHash
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.variableMetadata = event.params.variableMetadata
  entity.variableMetadataB58 = event.params.variableMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let post = new Post(event.address.toHex())
  post.operator = entity.operator
  post.staticMetadata = entity.staticMetadata
  post.staticMetadataB58 = entity.staticMetadataB58
  post.variableMetadata = entity.variableMetadata
  post.variableMetadataB58 = entity.variableMetadataB58
  post.proofHash = entity.proofHash
  post.save()
}

export function handleVariableMetadataSetPost(event: VariableMetadataSetPostEvent): void {
  let entity = new VariableMetadataSetPost(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.variableMetadata = event.params.variableMetadata
  entity.variableMetadataB58 = event.params.variableMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let post = new Post(event.address.toHex())
  post.variableMetadata = entity.variableMetadata
  post.variableMetadataB58 = entity.variableMetadataB58
  post.save()
}

export function handleStaticMetadataSetPost(event: StaticMetadataSetPostEvent): void {
  let entity = new StaticMetadataSetPost(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleProofHashSetPost(event: ProofHashSetPostEvent): void {
  let entity = new ProofHashSetPost(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.caller = event.params.caller
  entity.proofHash = event.params.proofHash
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleOperatorUpdatedPost(event: OperatorUpdatedPostEvent): void {
  let entity = new OperatorUpdatedPost(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.operator = event.params.operator
  entity.status = event.params.status
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let post = new Post(event.address.toHex())
  post.operator = entity.operator
  post.operatorStatus = entity.status
  post.save()
}

export function handleExplicitInitDataOneWayGriefingFactory(event: ExplicitInitDataOneWayGriefingFactoryEvent): void {
  let entity = new ExplicitInitDataOneWayGriefingFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.staker = event.params.staker
  entity.counterparty = event.params.counterparty
  entity.operator = event.params.operator
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.countdownLength = event.params.countdownLength
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()
}

export function handleInstanceCreatedOneWayGriefingFactory(event: InstanceCreatedOneWayGriefingFactoryEvent): void {
  let entity = new InstanceCreatedOneWayGriefingFactory(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.params.instance
  entity.creator = event.params.creator
  entity.callData = event.params.callData
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.params.instance.toHex())
  oneWayGriefing.creator = entity.creator
  oneWayGriefing.createdTimestamp = entity.timestamp
  oneWayGriefing.initCallData = entity.callData
  oneWayGriefing.save()

  OneWayGriefingDataSource.create(event.params.instance)
}

export function handleVariableMetadataSetOneWayGriefing(event: VariableMetadataSetOneWayGriefingEvent): void {
  let entity = new VariableMetadataSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.variableMetadata = event.params.variableMetadata
  entity.variableMetadataB58 = event.params.variableMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.variableMetadata = entity.variableMetadata
  oneWayGriefing.variableMetadataB58 = entity.variableMetadataB58
  oneWayGriefing.save()
}

export function handleStaticMetadataSetOneWayGriefing(event: StaticMetadataSetOneWayGriefingEvent): void {
  let entity = new StaticMetadataSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staticMetadata = event.params.staticMetadata
  entity.staticMetadataB58 = event.params.staticMetadata.toBase58()
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.staticMetadata = entity.staticMetadata
  oneWayGriefing.staticMetadataB58 = entity.staticMetadataB58
  oneWayGriefing.save()
}

export function handleRatioSetOneWayGriefing(event: RatioSetOneWayGriefingEvent): void {
  let entity = new RatioSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.ratio = event.params.ratio
  entity.ratioType = event.params.ratioType
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.ratio = entity.ratio
  oneWayGriefing.ratioType = entity.ratioType
  oneWayGriefing.save()
}

export function handleOperatorUpdatedOneWayGriefing(event: OperatorUpdatedOneWayGriefingEvent): void {
  let entity = new OperatorUpdatedOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.operator = event.params.operator
  entity.status = event.params.status
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.operator = entity.operator
  oneWayGriefing.operatorStatus = entity.status
  oneWayGriefing.save()
}

export function handleGriefedOneWayGriefing(event: GriefedOneWayGriefingEvent): void {
  let entity = new GriefedOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.punisher = event.params.punisher
  entity.staker = event.params.staker
  entity.punishment = event.params.punishment
  entity.cost = event.params.cost
  entity.message = event.params.message
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.stake = oneWayGriefing.stake.minus(entity.punishment)
  oneWayGriefing.staker = entity.staker
  oneWayGriefing.save()
}

export function handleTokenSetOneWayGriefing(event: TokenSetOneWayGriefingEvent): void {
  let entity = new TokenSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.token = event.params.token
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.token = entity.token
  oneWayGriefing.save()
}

export function handleStakeAddedOneWayGriefing(event: StakeAddedOneWayGriefingEvent): void {
  let entity = new StakeAddedOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staker = event.params.staker
  entity.funder = event.params.funder
  entity.amount = event.params.amount
  entity.newStake = event.params.newStake
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.stake = entity.newStake
  oneWayGriefing.staker = entity.staker
  oneWayGriefing.save()
}

export function handleStakeTakenOneWayGriefing(event: StakeTakenOneWayGriefingEvent): void {
  let entity = new StakeTakenOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staker = event.params.staker
  entity.recipient = event.params.recipient
  entity.amount = event.params.amount
  entity.newStake = event.params.newStake
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.stake = entity.newStake
  oneWayGriefing.staker = entity.staker
  oneWayGriefing.save()
}

export function handleStakeBurnedOneWayGriefing(event: StakeBurnedOneWayGriefingEvent): void {
  let entity = new StakeBurnedOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.staker = event.params.staker
  entity.amount = event.params.amount
  entity.newStake = event.params.newStake
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.stake = entity.newStake
  oneWayGriefing.staker = entity.staker
  oneWayGriefing.save()
}

export function handleLengthSetOneWayGriefing(event: LengthSetOneWayGriefingEvent): void {
  let entity = new LengthSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.length = event.params.length
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.countdownLength = entity.length
  oneWayGriefing.save()
}

export function handleDeadlineSetOneWayGriefing(event: DeadlineSetOneWayGriefingEvent): void {
  let entity = new DeadlineSetOneWayGriefing(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  entity.instance = event.address
  entity.deadline = event.params.deadline
  entity.timestamp = event.block.timestamp
  entity.txHash = event.transaction.hash
  entity.logIndex = event.logIndex
  entity.save()

  let oneWayGriefing = new OneWayGriefingAgreement(event.address.toHex())
  oneWayGriefing.deadline = entity.deadline
  oneWayGriefing.save()
}
