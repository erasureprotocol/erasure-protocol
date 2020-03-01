const { RATIO_TYPES, TOKEN_TYPES } = require('../helpers/variables')
const { abiEncodeWithSelector } = require('../helpers/utils')

const CountdownGriefingArtifact = require('../../build/CountdownGriefing.json')
const CountdownGriefingFactoryArtifact = require('../../build/CountdownGriefing_Factory.json')
const AgreementsRegistryArtifact = require('../../build/Erasure_Agreements.json')
const MockNMRArtifact = require('../../build/MockNMR.json')

describe('CountdownGriefing', function() {
  // wallets and addresses
  const [
    operatorWallet,
    counterpartyWallet,
    stakerWallet,
    newOperatorWallet,
  ] = accounts
  const operator = operatorWallet.signer.signingKey.address
  const counterparty = counterpartyWallet.signer.signingKey.address
  const staker = stakerWallet.signer.signingKey.address
  const newOperator = newOperatorWallet.signer.signingKey.address

  // variables used in initialize()
  const tokenID = TOKEN_TYPES.NMR
  const stakerStake = ethers.utils.parseEther('200')
  const punishment = ethers.utils.parseEther('100')
  const ratio = 2
  const ratioE18 = ethers.utils.parseEther(ratio.toString())
  const ratioType = RATIO_TYPES.Dec
  const countdownLength = 1000
  const staticMetadata = 'TESTING'

  const createABITypes = [
    'address',
    'address',
    'address',
    'uint8',
    'uint256',
    'uint8',
    'uint256',
    'bytes',
  ]
  const initArgs = [
    operator,
    staker,
    counterparty,
    tokenID,
    ratioE18,
    ratioType,
    countdownLength,
    Buffer.from(staticMetadata),
  ]

  // helper function to deploy TestCountdownGriefing
  const deployAgreement = async (args = initArgs) => {
    const callData = abiEncodeWithSelector('initialize', createABITypes, args)
    const txn = await this.Factory.from(operator).create(callData)

    const receipt = await this.Factory.verboseWaitForTransaction(txn)

    const eventLogs = utils.parseLogs(receipt, this.Factory, 'InstanceCreated')
    assert.equal(eventLogs.length, 1)

    const [event] = eventLogs
    const agreementAddress = event.instance

    const contract = deployer.wrapDeployedContract(
      CountdownGriefingArtifact,
      agreementAddress,
    )

    return contract
  }

  const deployDeactivatedAgreement = async () => {
    const agreement = await deployAgreement()
    await agreement.from(operator).renounceOperator()
    return agreement
  }

  before(async () => {
    this.CountdownGriefing = await deployer.deploy(CountdownGriefingArtifact)
    this.Registry = await deployer.deploy(AgreementsRegistryArtifact)
    this.Factory = await deployer.deploy(
      CountdownGriefingFactoryArtifact,
      false,
      this.Registry.contractAddress,
      this.CountdownGriefing.contractAddress,
    )
    await this.Registry.from(deployer.signer).addFactory(
      this.Factory.contractAddress,
      '0x',
    )

    this.DeactivatedGriefing = await deployDeactivatedAgreement()

    // fill the token balances of the counterparty and staker
    // counterparty & staker has 1,000 * 10^18 each
    const startingBalance = '1000'
    await NMR.from(counterparty).mintMockTokens(
      counterparty,
      ethers.utils.parseEther(startingBalance),
    )
    await NMR.from(staker).mintMockTokens(
      staker,
      ethers.utils.parseEther(startingBalance),
    )
    await NMR.from(operator).mintMockTokens(
      operator,
      ethers.utils.parseEther(startingBalance),
    )
  })

  describe('CountdownGriefing.initialize', () => {
    it('should revert when caller is not contract', async () => {
      await assert.revertWith(
        this.CountdownGriefing.initialize(...initArgs),
        'must be called within contract constructor',
      )
    })

    it('should initialize contract with countdownLength=0', async () => {
      const countdownLength = 0

      this.TestCountdownGriefing = await deployAgreement([
        operator,
        staker,
        counterparty,
        tokenID,
        ratioE18,
        ratioType,
        countdownLength,
        Buffer.from(staticMetadata),
      ])

      // Countdown._setLength
      const actualLength = await this.TestCountdownGriefing.getLength()
      assert.equal(actualLength, countdownLength)
    })

    it('should initialize contract', async () => {
      this.TestCountdownGriefing = await deployAgreement()

      // check that it's the TestCountdownGriefing state that is changed
      // not the CountdownGriefing logic contract's state

      // check all the state changes

      // Staking._setToken
      const [token] = await this.TestCountdownGriefing.getToken()
      assert.equal(token, tokenID)

      // _data.staker
      const getStaker = await this.TestCountdownGriefing.getStaker()
      assert.equal(getStaker, staker)

      // _data.counterparty
      const getCounterparty = await this.TestCountdownGriefing.getCounterparty()
      assert.equal(getCounterparty, counterparty)

      // Operator._setOperator
      const operator = await this.TestCountdownGriefing.getOperator()
      assert.equal(operator, operator)

      // Griefing._setRatio
      const [
        actualRatio,
        actualRatioType,
      ] = await this.TestCountdownGriefing.getRatio(staker)
      assert.equal(actualRatio.toString(), ratioE18.toString())
      assert.equal(actualRatioType, ratioType)

      // Countdown._setLength
      const actualLength = await this.TestCountdownGriefing.getLength()
      assert.equal(actualLength, countdownLength)
    })

    it('should revert when not initialized from constructor', async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.initialize(...initArgs),
        'must be called within contract constructor',
      )
    })
  })

  describe('CountdownGriefing.setMetadata', () => {
    const stakerMetadata = 'STAKER'
    const operatorMetadata = 'OPERATOR'

    it('should revert when msg.sender is not active operator', async () => {
      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).setMetadata(
          Buffer.from(stakerMetadata),
        ),
        'only operator',
      )
    })

    it('should revert when msg.sender is deactivated operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).setMetadata(
          Buffer.from(stakerMetadata),
        ),
        'only operator',
      )
    })

    it('should set metadata when msg.sender is operator', async () => {
      const txn = await this.TestCountdownGriefing.from(operator).setMetadata(
        Buffer.from(operatorMetadata),
      )
      await assert.emitWithArgs(
        txn,
        'MetadataSet',
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(operatorMetadata)),
      )
    })
  })

  describe('CountdownGriefing.startCountdown', () => {
    const startCountdown = async msgSender => {
      const txn = await this.TestCountdownGriefing.from(
        msgSender,
      ).startCountdown()

      const block = await deployer.provider.getBlock('latest')
      const blockTimestamp = block.timestamp
      const deadline = blockTimestamp + countdownLength

      await assert.emitWithArgs(txn, 'DeadlineSet', deadline)
    }

    it('should revert when msg.sender is not staker or active operator', async () => {
      // use the staker as the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).startCountdown(),
        'only staker or operator',
      )
    })

    it('should revert when msg.sender is deactivated operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).startCountdown(),
        'only staker or operator',
      )
    })

    it('should start countdown when msg.sender is staker', async () =>
      await startCountdown(staker))

    it('should revert when deadline already set', async () =>
      await assert.revertWith(startCountdown(staker), 'deadline already set'))

    it('should start countdown when msg.sender is operator', async () => {
      // it will throw when calling startCountdown again
      // re-deploy a new TestCountdownGriefing and initialize
      this.TestCountdownGriefing = await deployAgreement()

      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider)

      await startCountdown(operator)

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID)
    })
  })

  describe('CountdownGriefing.increaseStake', () => {
    let currentStake // to increment as we go
    let amountToAdd = 500 // 500 token weis

    const increaseStake = async sender => {
      await NMR.from(sender).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await NMR.allowance(sender, this.TestCountdownGriefing.contractAddress),
        amountToAdd,
      )

      const txn = await this.TestCountdownGriefing.from(sender).increaseStake(
        amountToAdd,
      )

      currentStake += amountToAdd

      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn,
      )
      const depositIncreasedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === 'DepositIncreased',
        'There is no such event',
      )

      assert.isDefined(depositIncreasedEvent)
      assert.equal(depositIncreasedEvent.args.tokenID, tokenID)
      assert.equal(depositIncreasedEvent.args.user, staker)
      assert.equal(depositIncreasedEvent.args.amount.toNumber(), amountToAdd)
    }

    it('should revert when msg.sender is counterparty', async () => {
      // update currentStake
      currentStake = (await this.TestCountdownGriefing.getStake()).toNumber()

      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).increaseStake(
          amountToAdd,
        ),
        'only staker or operator',
      )
    })

    it('should revert when msg.sender is deactivated operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).increaseStake(amountToAdd),
        'only staker or operator',
      )
    })

    it('should increase stake when msg.sender is staker', async () => {
      await increaseStake(staker)
    })

    it('should increase stake when msg.sender is operator', async () => {
      await increaseStake(operator)
    })

    it('should revert when countdown over', async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider)

      await this.TestCountdownGriefing.from(staker).startCountdown()

      // get current blockTimestamp so we can reset later
      const block = await deployer.provider.getBlock('latest')
      const oldTimestamp = block.timestamp

      // set to 1000 seconds after the deadline
      const timePastDeadline = 1000
      const newTimestamp = oldTimestamp + countdownLength + timePastDeadline
      await utils.setTimeTo(deployer.provider, newTimestamp)

      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).increaseStake(amountToAdd),
        'agreement ended',
      )

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID)
    })
  })

  describe('CountdownGriefing.reward', () => {
    let currentStake // to increment as we go
    let amountToAdd = 500 // 500 token weis

    const reward = async sender => {
      // update currentStake
      currentStake = (await this.TestCountdownGriefing.getStake()).toNumber()

      await NMR.from(sender).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await NMR.allowance(sender, this.TestCountdownGriefing.contractAddress),
        amountToAdd,
      )

      const txn = await this.TestCountdownGriefing.from(sender).reward(
        amountToAdd,
      )

      currentStake += amountToAdd

      assert.equal(
        (await this.TestCountdownGriefing.getStake()).toNumber(),
        currentStake,
      )

      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn,
      )
      const depositIncreasedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === 'DepositIncreased',
        'There is no such event',
      )

      assert.isDefined(depositIncreasedEvent)
      assert.equal(depositIncreasedEvent.args.tokenID, tokenID)
      assert.equal(depositIncreasedEvent.args.user, staker)
      assert.equal(depositIncreasedEvent.args.amount.toNumber(), amountToAdd)
    }

    it('should revert when msg.sender is staker', async () => {
      // update currentStake
      currentStake = (await this.TestCountdownGriefing.getStake()).toNumber()

      // use the staker to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).reward(amountToAdd),
        'only counterparty or operator',
      )
    })

    it('should revert when msg.sender is deactivated operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).reward(amountToAdd),
        'only counterparty or operator',
      )
    })

    it('should succeed when msg.sender is counterparty', async () => {
      await reward(counterparty)
    })

    it('should succeed when msg.sender is operator', async () => {
      await reward(operator)
    })

    it('should revert when countdown over', async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider)

      await this.TestCountdownGriefing.from(staker).startCountdown()

      // get current blockTimestamp so we can reset later
      const block = await deployer.provider.getBlock('latest')
      const oldTimestamp = block.timestamp

      // set to 1000 seconds after the deadline
      const timePastDeadline = 1000
      const newTimestamp = oldTimestamp + countdownLength + timePastDeadline
      await utils.setTimeTo(deployer.provider, newTimestamp)

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).reward(amountToAdd),
        'agreement ended',
      )

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID)
    })
  })

  describe('CountdownGriefing.punish', () => {
    const from = counterparty
    const message = "I don't like you"
    let currentStake = ethers.utils.bigNumberify('0')

    const punishStaker = async () => {
      // increase staker's stake to 500
      await NMR.from(staker).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await NMR.allowance(staker, this.TestCountdownGriefing.contractAddress),
        stakerStake,
      )

      await this.TestCountdownGriefing.from(staker).increaseStake(stakerStake)
      currentStake = currentStake.add(stakerStake)

      const expectedCost = punishment.mul(ratio)

      await NMR.from(counterparty).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await NMR.allowance(
          counterparty,
          this.TestCountdownGriefing.contractAddress,
        ),
        expectedCost,
      )

      const txn = await this.TestCountdownGriefing.from(counterparty).punish(
        punishment,
        Buffer.from(message),
      )
      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn,
      )

      // deducting current stake to be used in subsequent increaseStake call
      currentStake = currentStake.sub(punishment)

      const expectedEvent = 'Griefed'

      const griefedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        'There is no such event',
      )

      assert.isDefined(griefedEvent)
      assert.equal(griefedEvent.args.punisher, counterparty)
      assert.equal(griefedEvent.args.staker, staker)
      assert.equal(
        griefedEvent.args.punishment.toString(),
        punishment.toString(),
      )
      assert.equal(griefedEvent.args.cost.toString(), expectedCost.toString())
      assert.equal(
        griefedEvent.args.message,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message)),
      )
    }

    it('should revert when msg.sender is not counterparty or active operator', async () => {
      // update currentStake
      currentStake = await this.TestCountdownGriefing.getStake()

      // staker is not counterparty or operator
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).punish(
          punishment,
          Buffer.from(message),
        ),
        'only counterparty or operator',
      )
    })

    it('should revert when agreement ended', async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider)

      // required to start countdown

      await this.TestCountdownGriefing.from(staker).startCountdown()

      // move time forward to after the deadline

      const block = await deployer.provider.getBlock('latest')
      const blockTimestamp = block.timestamp

      const exceedDeadlineBy = 1000
      const futureTimestamp =
        blockTimestamp + countdownLength + exceedDeadlineBy

      await utils.setTimeTo(deployer.provider, futureTimestamp)

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).punish(
          punishment,
          Buffer.from(message),
        ),
        'agreement ended',
      )

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID)
    })

    it('should revert when no approval to burn tokens', async () => {
      currentStake = await this.TestCountdownGriefing.getStake()

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).punish(
          punishment,
          Buffer.from(message),
        ),
        'nmr burnFrom failed',
      )
    })

    it('should punish staker when startCountdown not called', async () =>
      await punishStaker())

    it('should punish staker when countdown not ended', async () => {
      await this.TestCountdownGriefing.from(staker).startCountdown()
      await punishStaker()
    })
  })

  describe('CountdownGriefing.releaseStake', () => {
    let currentStake
    const releaseAmount = ethers.utils.parseEther('100')

    const releaseStake = async (sender, staker, releaseAmount) => {
      const currentStake = await this.TestCountdownGriefing.getStake()

      const txn = await this.TestCountdownGriefing.from(sender).releaseStake(
        releaseAmount,
      )
      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn,
      )
      const depositDecreasedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === 'DepositDecreased',
        'There is no such event',
      )

      assert.isDefined(depositDecreasedEvent)
      assert.equal(depositDecreasedEvent.args.tokenID, tokenID)
      assert.equal(depositDecreasedEvent.args.user, staker)
      assert.equal(
        depositDecreasedEvent.args.amount.toString(),
        releaseAmount.toString(),
      )
    }

    it('should revert when msg.sender is not counterparty or active operator', async () => {
      currentStake = await this.TestCountdownGriefing.getStake()

      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).releaseStake(releaseAmount),
        'only counterparty or operator',
      )
    })

    it('should revert when msg.sender is operator but not active', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).releaseStake(releaseAmount),
        'only counterparty or operator',
      )
    })

    it('should release stake when msg.sender is counterparty', async () =>
      await releaseStake(counterparty, staker, releaseAmount))

    it('should release full stake', async () => {
      const currentStake = await this.TestCountdownGriefing.getStake()
      await releaseStake(counterparty, staker, currentStake)
    })

    it('should release stake when msg.sender is active operator', async () => {
      // have to re-increase stake to release
      await NMR.from(staker).approve(
        this.TestCountdownGriefing.contractAddress,
        stakerStake,
      )

      const currentStake = await this.TestCountdownGriefing.getStake()

      await this.TestCountdownGriefing.from(staker).increaseStake(stakerStake)

      await releaseStake(operator, staker, releaseAmount)
    })
  })

  describe('CountdownGriefing.retrieveStake', () => {
    it('should revert when msg.sender is not staker or active operator', async () => {
      // redeploy contract since countdown is started
      this.TestCountdownGriefing = await deployAgreement()

      // counterparty is not staker or operator
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).retrieveStake(
          counterparty,
        ),
        'only staker or operator',
      )
    })

    it('should revert when msg.sender is deactivated operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).retrieveStake(counterparty),
        'only staker or operator',
      )
    })

    it('should revert when start countdown not called', async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).retrieveStake(staker),
        'deadline not passed',
      )
    })

    it('should revert when deadline not passed (when countdown is started)', async () => {
      await this.TestCountdownGriefing.from(staker).startCountdown()

      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).retrieveStake(staker),
        'deadline not passed',
      )
    })

    it('should retrieve stake correctly', async () => {
      // redeploy contract since countdown is started
      this.TestCountdownGriefing = await deployAgreement()

      // staker increase stake

      await NMR.from(staker).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await NMR.allowance(staker, this.TestCountdownGriefing.contractAddress),
        stakerStake,
      )

      await this.TestCountdownGriefing.from(staker).increaseStake(stakerStake)

      // required to start countdown

      await this.TestCountdownGriefing.from(staker).startCountdown()

      // move time forward to after the deadline

      const block = await deployer.provider.getBlock('latest')
      const blockTimestamp = block.timestamp

      const exceedDeadlineBy = 1000
      const futureTimestamp =
        blockTimestamp + countdownLength + exceedDeadlineBy

      await utils.setTimeTo(deployer.provider, futureTimestamp)

      // retrieve stake after the deadline has passed

      const txn = await this.TestCountdownGriefing.from(staker).retrieveStake(
        staker,
      )

      // check receipt for correct event logs
      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn,
      )
      const [DepositDecreasedEvent] = utils.parseLogs(
        receipt,
        this.TestCountdownGriefing,
        'DepositDecreased',
      )

      assert.equal(DepositDecreasedEvent.tokenID, tokenID)
      assert.equal(DepositDecreasedEvent.user, staker)
      assert.equal(
        DepositDecreasedEvent.amount.toString(),
        stakerStake.toString(),
      )
    })
  })

  describe('CountdownGriefing.transferOperator', () => {
    it('should revert when msg.sender is not operator', async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).transferOperator(
          newOperator,
        ),
        'only operator',
      )
    })

    it('should revert when msg.sender is not active operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).transferOperator(newOperator),
        'only operator',
      )
    })

    it('should transfer operator', async () => {
      const txn = await this.TestCountdownGriefing.from(
        operator,
      ).transferOperator(newOperator)
      await assert.emitWithArgs(txn, 'OperatorUpdated', [newOperator])

      const actualOperator = await this.TestCountdownGriefing.getOperator()
      assert.equal(actualOperator, newOperator)
    })
  })

  describe('CountdownGriefing.renounceOperator', () => {
    it('should revert when msg.sender is not operator', async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).renounceOperator(),
        'only operator',
      )
    })

    it('should revert when msg.sender is not active operator', async () => {
      await assert.revertWith(
        this.DeactivatedGriefing.from(operator).renounceOperator(),
        'only operator',
      )
    })

    it('should succeed', async () => {
      this.TestCountdownGriefing = await deployAgreement()

      const txn = await this.TestCountdownGriefing.from(
        operator,
      ).renounceOperator()
      await assert.emitWithArgs(txn, 'OperatorUpdated', [
        ethers.constants.AddressZero,
      ])

      const actualOperator = await this.TestCountdownGriefing.getOperator()
      assert.equal(actualOperator, ethers.constants.AddressZero)
    })
  })
})
