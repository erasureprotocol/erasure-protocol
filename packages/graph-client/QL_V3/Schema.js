const Queries = {
    //CountDownEscrow
    countdownGriefingEscrows: {
        dataReturn: `id
        creator
        operator
        buyer
        seller
        tokenID
        paymentAmount
        stakeAmount
        countdownLength
        agreementParams
        deadline
        length
        data
        dataB58
        dataSubmitted
        paymentDeposited
        stakeDeposited
        finalized
        cancelled
        metadata
        metadataB58
        countdownGriefingAgreement
        initMetadata
        initMetadataB58
        initCallData
        createdTimestamp`
    },
    instanceCreatedCountdownGriefingEscrowFactories: {
        returnData: `id
        instance
        creator
        callData
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    cancelledCountdownGriefingEscrows: {
        returnData: ` id
        contract
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    dataSubmittedCountdownGriefingEscrows: {
        returnData: `id
        contract
        data
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    deadlineSetCountdownGriefingEscrows: {
        returnData: `id
        contract
        deadline
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    finalizedCountdownGriefingEscrows: {
        returnData:`id
        contract
        agreement
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    initializedCountdownGriefingEscrows: {
        returnData:`id
        contract
        operator
        buyer
        seller
        tokenID
        paymentAmount
        stakeAmount
        countdownLength
        metadata
        metadataB58
        agreementParams
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    lengthSetCountdownGriefingEscrows: {
        returnData: `id
        contract
        length
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    metadataSetCountdownGriefingEscrows: {
        returnData:`id
        contract
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    operatorUpdatedCountdownGriefingEscrows: {
        returnData:`id
        contract
        operator
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    paymentDepositedCountdownGriefingEscrows: {
        returnData:`id
        contract
        buyer
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeDepositedCountdownGriefingEscrows: {
        returnData:`id
        contract
        seller
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeBurnedCountdownGriefingEscrows: {
        returnData: `id
        contract
        tokenID
        staker
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositDecreasedCountdownGriefingEscrows: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositIncreasedCountdownGriefingEscrows: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    countdownGriefings:{
        returnData:`id
        creator
        operator
        tokenID
        staker
        currentStake
        totalBurned
        totalTaken
        counterparty
        ratio
        ratioType
        countdownLength
        deadline
        metadata
        metadataB58
        initMetadata
        initMetadataB58
        initCallData
        createdTimestamp`
    },
    instanceCreatedCountdownGriefingFactories: {
        returnData:`id
        instance
        creator
        callData
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    initializedCountdownGriefings: {
        returnData:`id
        contract
        operator
        staker
        counterparty
        tokenID
        ratio
        ratioType
        countdownLength
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    deadlineSetCountdownGriefings: {
        returnData:`id
        contract
        deadline
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    lengthSetCountdownGriefings: {
        returnData:`id
        contract
        length
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    ratioSetCountdownGriefings: {
        returnData:`id
        contract
        staker
        tokenID
        ratio
        ratioType
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositDecreasedCountdownGriefings: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
      },
    depositIncreasedCountdownGriefings: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    griefedCountdownGriefings: {
        returnData:`id
        contract
        punisher
        staker
        punishment
        cost
        message
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    operatorUpdatedCountdownGriefings: {
        returnData:`id
        contract
        operator
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    metadataSetCountdownGriefings: {
        returnData:`id
        contract
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeAddedCountdownGriefings: {
        returnData:`id
        contract
        staker
        funder
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeTakenCountdownGriefings: {
        returnData:`id
        contract
        staker
        recipient
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeBurnedCountdownGriefings: {
        returnData:`id
        contract
        tokenID
        staker
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    simpleGriefings: {
        returnData:`id
        creator
        operator
        staker
        currentStake
        totalBurned
        totalTaken
        counterparty
        ratio
        ratioType
        metadata
        metadataB58
        initMetadata
        initMetadataB58
        initCallData
        createdTimestamp`
    },
    instanceCreatedSimpleGriefingFactories: {
        returnData:`id
        instance
        creator
        callData
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositDecreasedSimpleGriefings: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositIncreasedSimpleGriefings : {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },      
    griefedSimpleGriefings: {
        returnData:`id
        contract
        punisher
        staker
        punishment
        cost
        message
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    initializedSimpleGriefings: {
        returnData:`id
        contract
        operator
        staker
        counterparty
        tokenID
        ratio
        ratioType
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    metadataSetSimpleGriefings: {
        returnData:`id
        contract
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    operatorUpdatedSimpleGriefings: {
        returnData:`id
        contract
        operator
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    ratioSetSimpleGriefings: {
        returnData:`id
        contract
        staker
        tokenID
        ratio
        ratioType
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeAddedSimpleGriefings: {
        returnData:`id
        contract
        tokenID
        staker
        funder
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    stakeBurnedSimpleGriefings: {
        returnData:`id
        contract
        tokenID
        staker
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },

    //Feeds
    feeds: {
        returnData: `id
        creator
        operator
        metadata
        metadataB58
        hashes
        initMetadata
        initMetadataB58
        initCallData
        createdTimestamp`
    },
    instanceCreatedFeedFactories: {
        returnData:`id
        staker
        recipient
        amount
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    hashSubmittedFeeds: {
        returnData: `
        id
        contract
        hash
        blockNumber
        timestamp
        txHash
        logIndex
        `
    },
    initializedFeeds: {
        returnData:`id
        contract
        operator
        proofHash
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    operatorUpdatedFeeds: {
        returnData:`id
        operator
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    metadataSetFeeds: {
        returnData:`id
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositDecreasedFeeds: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    depositIncreasedFeeds: {
        returnData: `id
        contract
        tokenID
        user
        amount
        newDeposit
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    operatorUpdatedFeeds: {
        returnData: `id
        contract
        operator
        blockNumber
        timestamp
        txHash
        logIndex`
    },
    metadataSetFeeds: {
        returnData: `id
        contract
        metadata
        metadataB58
        blockNumber
        timestamp
        txHash
        logIndex`
    }

}

module.exports = Queries