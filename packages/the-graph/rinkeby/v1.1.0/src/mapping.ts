// import { BigInt } from "@graphprotocol/graph-ts"
import { InstanceCreated as InstanceCreatedFeedFactoryEvent } from "../generated/FeedFactory/FeedFactory"
import { InstanceCreated as InstanceCreatedPostFactoryEvent } from "../generated/PostFactory/PostFactory"
import { InstanceCreated as InstanceCreatedCountdownGriefingFactoryEvent } from "../generated/CountdownGriefingFactory/CountdownGriefingFactory"
import { InstanceCreated as InstanceCreatedSimpleGriefingFactoryEvent } from "../generated/SimpleGriefingFactory/SimpleGriefingFactory"
import {
  InstanceCreatedFeedFactory,
  InstanceCreatedPostFactory,
  InstanceCreatedCountdownGriefingFactory,
  InstanceCreatedSimpleGriefingFactory,
  Feed,
  InitializedFeed,
  HashSubmittedFeed,
  HashFormatSetFeed,
  OperatorUpdatedFeed,
  MetadataSetFeed,
  InitializedPost,
  ProofHashSetPost,
  OperatorUpdatedPost,
  MetadataSetPost,
  InitializedCountdownGriefing,
  RatioSetCountdownGriefing,
  GriefedCountdownGriefing,
  LengthSetCountdownGriefing,
  OperatorUpdatedCountdownGriefing,
  MetadataSetCountdownGriefing,
  StakeAddedCountdownGriefing,
  StakeTakenCountdownGriefing,
  StakeBurnedCountdownGriefing,
  DeadlineSetCountdownGriefing,
  InitializedSimpleGriefing,
  RatioSetSimpleGriefing,
  GriefedSimpleGriefing,
  OperatorUpdatedSimpleGriefing,
  MetadataSetSimpleGriefing,
  StakeAddedSimpleGriefing,
  StakeTakenSimpleGriefing,
  StakeBurnedSimpleGriefing
} from "../generated/schema"

export function handleInstanceCreatedFeedFactory(event: InstanceCreatedFeedFactoryEvent): void {

}
