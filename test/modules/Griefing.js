const ethers = require('ethers')
const { initDeployment } = require('../helpers/setup')

const { hexlify } = require('../helpers/utils')
const { RATIO_TYPES } = require('../helpers/variables')

describe('Griefing', function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2],
  }

  let contracts = {
    TestGriefing: {
      artifact: require('../../build/TestGriefing.json'),
    },
  }

  let deployer
  before(async () => {
    ;[this.deployer, this.MockNMR] = await initDeployment()
    deployer = this.deployer

    const buyer = wallets.buyer.signer.signingKey.address
    const seller = wallets.seller.signer.signingKey.address

    // fill the token balances of the buyer and seller
    // buyer & seller has 1,000 tokens each
    const startingBalance = '1000'
    await this.MockNMR.from(buyer).mintMockTokens(
      buyer,
      ethers.utils.parseEther(startingBalance),
    )
    await this.MockNMR.from(seller).mintMockTokens(
      seller,
      ethers.utils.parseEther(startingBalance),
    )
  })

  beforeEach(async () => {
    contracts.TestGriefing.instance = await deployer.deploy(
      contracts.TestGriefing.artifact,
    )
  })

  // test pure functions

  describe('Griefing.getCost', () => {
    const punishment = 10
    const ratio = 2

    it('should revert when ratioType is NaN (no punishment)', async () => {
      // no calculation can be made when no punishment is allowed
      await assert.revertWith(
        contracts.TestGriefing.instance.getCost(
          ratio,
          punishment,
          RATIO_TYPES.NaN,
        ),
        'ratioType cannot be RatioType.NaN',
      )
    })

    it('should getCost for ratioType Dec correctly', async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ethers.utils.parseEther(ratio + ''),
        punishment,
        RATIO_TYPES.Dec,
      )
      assert.equal(cost.toNumber(), punishment * ratio)
    })

    const halfRatio = 0.5
    it('should getCost for ratioType Dec correctly with .5 ratio', async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ethers.utils.parseEther(halfRatio + ''),
        punishment,
        RATIO_TYPES.Dec,
      )
      assert.equal(cost.toNumber(), punishment * halfRatio)
    })

    it('should getCost for ratioType Inf correctly', async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ratio,
        punishment,
        RATIO_TYPES.Inf,
      )
      assert.equal(cost.toNumber(), 0)
    })
  })

  describe('Griefing.getPunishment', () => {
    const cost = 20
    const ratio = 2

    it('should revert when ratioType is NaN (no punishment)', async () => {
      // no calculation can be made when no punishment is allowed
      await assert.revertWith(
        contracts.TestGriefing.instance.getPunishment(
          ratio,
          cost,
          RATIO_TYPES.NaN,
        ),
        'ratioType cannot be RatioType.NaN',
      )
    })

    it('should revert when ratioType is Inf (punishment at no cost)', async () => {
      // no calculation can be made when no cost to be computed from
      await assert.revertWith(
        contracts.TestGriefing.instance.getPunishment(
          ratio,
          cost,
          RATIO_TYPES.Inf,
        ),
        'ratioType cannot be RatioType.Inf',
      )
    })

    it('should getPunishment for ratioType Dec correctly', async () => {
      const punishment = await contracts.TestGriefing.instance.getPunishment(
        ethers.utils.parseEther(ratio + ''),
        cost,
        RATIO_TYPES.Dec,
      )
      assert.equal(punishment.toNumber(), cost / ratio)
    })

    const halfRatio = 0.5
    it('should getPunishment for ratioType Dec correctly with .5 ratio', async () => {
      const punishment = await contracts.TestGriefing.instance.getPunishment(
        ethers.utils.parseEther(halfRatio + ''),
        cost,
        RATIO_TYPES.Dec,
      )
      assert.equal(punishment.toNumber(), cost / halfRatio)
    })
  })

  // test state functions

  describe('Griefing._setRatio', () => {
    const seller = wallets.seller.signer.signingKey.address
    const ratioType = RATIO_TYPES.Dec

    it('should revert on wrong ratioType', async () => {
      const ratio = 2
      const invalidRatioTypeEnumVal = 5
      const block = await deployer.provider.getBlock('latest')

      // sending in an invalid enum value eats up the block's gas limit
      // setting a per-txn gasLimit avoids that
      await assert.revert(
        contracts.TestGriefing.instance.setRatio(
          seller,
          ethers.utils.parseEther(ratio + ''),
          invalidRatioTypeEnumVal,
          { gasLimit: 30000 },
        ),
      )
    })

    it('should revert when ratio != 0 when ratioType is NaN', async () => {
      const ratioType = RATIO_TYPES.NaN
      const ratio = ethers.utils.parseEther('2')
      await assert.revertWith(
        contracts.TestGriefing.instance.setRatio(seller, ratio, ratioType),
        'ratio must be 0 when ratioType is NaN or Inf',
      )
    })

    it('should revert when ratio != 0 when ratioType is Inf', async () => {
      const ratioType = RATIO_TYPES.Inf
      const ratio = ethers.utils.parseEther('2')
      await assert.revertWith(
        contracts.TestGriefing.instance.setRatio(seller, ratio, ratioType),
        'ratio must be 0 when ratioType is NaN or Inf',
      )
    })

    it('should set ratio of 2 correctly', async () => {
      const ratio = ethers.utils.parseEther('2')
      const txn = await contracts.TestGriefing.instance.setRatio(
        seller,
        ratio.toHexString(),
        ratioType,
      )
      await assert.emit(txn, 'RatioSet')
      await assert.emitWithArgs(txn, [seller, ratio, ratioType])

      const [
        actualRatio,
        actualRatioType,
      ] = await contracts.TestGriefing.instance.getRatio(seller)
      assert.equal(actualRatio.toString(), ratio.toString())
      assert.equal(actualRatioType, ratioType)
    })

    it('should set ratio of 0.5 correctly', async () => {
      const ratio = ethers.utils.parseEther('0.5')
      const txn = await contracts.TestGriefing.instance.setRatio(
        seller,
        ratio,
        ratioType,
      )
      await assert.emit(txn, 'RatioSet')
      await assert.emitWithArgs(txn, [seller, ratio, ratioType])

      const [
        actualRatio,
        actualRatioType,
      ] = await contracts.TestGriefing.instance.getRatio(seller)
      assert.equal(actualRatio.toString(), ratio.toString())
      assert.equal(actualRatioType, ratioType)
    })
  })

  describe('Griefing._grief', () => {
    const seller = wallets.seller.signer.signingKey.address
    const buyer = wallets.buyer.signer.signingKey.address
    const ratio = ethers.utils.parseEther('2')
    const stakeAmount = ethers.utils.parseEther('100')
    const punishment = ethers.utils.parseEther('10')
    const ratioType = RATIO_TYPES.Dec
    const message = "I don't like you"
    let currentStake = ethers.utils.bigNumberify('0')

    it('should revert when grief ratio not set', async () => {
      await assert.revertWith(
        contracts.TestGriefing.instance.grief(
          buyer,
          seller,
          punishment,
          Buffer.from(message),
        ),
        'no punishment allowed',
      )
    })

    it('should revert when grief ratio is NaN', async () => {
      await contracts.TestGriefing.instance.setRatio(seller, 0, RATIO_TYPES.NaN)

      await assert.revertWith(
        contracts.TestGriefing.instance.grief(
          buyer,
          seller,
          punishment,
          Buffer.from(message),
        ),
        'no punishment allowed',
      )
    })

    it('should revert when not approved to burn', async () => {
      await contracts.TestGriefing.instance.setRatio(seller, ratio, ratioType)

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        'nmr burnFrom failed',
      )
    })

    it('should revert when buyer approve lesser than punishment', async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress

      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType)

      const wrongApproveAmount = punishment.sub(1)
      await this.MockNMR.from(buyer).approve(
        contractAddress,
        wrongApproveAmount,
      )

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        'nmr burnFrom failed',
      )
    })

    it('should revert when seller has not staked anything', async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress

      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType)
      await this.MockNMR.from(buyer).approve(contractAddress, punishment)

      await assert.revert(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
      )
    })

    it('should revert when seller has too little stake', async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress
      const wrongStakeAmount = punishment.sub(1)

      // seller process
      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType)

      await this.MockNMR.from(seller).approve(contractAddress, wrongStakeAmount)

      await contracts.TestGriefing.instance
        .from(seller)
        .addStake(seller, seller, wrongStakeAmount)

      currentStake = wrongStakeAmount

      // buyer process
      await this.MockNMR.from(buyer).approve(
        contractAddress,
        punishment.mul(ratio),
      )

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        'insufficient deposit to remove',
      )
    })

    it('should grief correctly for no cost', async () => {
      const ratio = 0
      const ratioType = RATIO_TYPES.Inf
      const contractAddress = contracts.TestGriefing.instance.contractAddress

      // seller process
      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType)

      await this.MockNMR.from(seller).approve(contractAddress, stakeAmount)

      await contracts.TestGriefing.instance
        .from(seller)
        .addStake(seller, seller, stakeAmount)

      currentStake = stakeAmount

      // buyer process
      const expectedCost = 0 // punishment at no cost

      await this.MockNMR.from(buyer).approve(contractAddress, expectedCost)

      const txn = await contracts.TestGriefing.instance
        .from(buyer)
        .grief(buyer, seller, punishment, Buffer.from(message))
      const receipt = await contracts.TestGriefing.instance.verboseWaitForTransaction(
        txn,
      )

      const griefedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === 'Griefed',
        'There is no such event',
      )

      assert.isDefined(griefedEvent)
      assert.equal(griefedEvent.args.punisher, buyer)
      assert.equal(griefedEvent.args.staker, seller)
      assert.equal(
        griefedEvent.args.punishment.toString(),
        punishment.toString(),
      )
      assert.equal(griefedEvent.args.cost.toString(), expectedCost.toString())
      assert.equal(griefedEvent.args.message, hexlify(message))

      const griefCost = await contracts.TestGriefing.instance.getGriefCost()
      assert.equal(griefCost.toString(), expectedCost.toString())
    })

    it('should grief correctly for decimal', async () => {
      const ratio = 2
      const ratioE18 = ethers.utils.parseEther(ratio.toString())
      const ratioType = RATIO_TYPES.Dec
      const contractAddress = contracts.TestGriefing.instance.contractAddress

      // seller process
      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratioE18, ratioType)

      await this.MockNMR.from(seller).approve(contractAddress, stakeAmount)

      await contracts.TestGriefing.instance
        .from(seller)
        .addStake(seller, seller, stakeAmount)

      currentStake = stakeAmount

      // buyer process
      const expectedCost = punishment.mul(ratio)

      await this.MockNMR.from(buyer).approve(contractAddress, expectedCost)

      const txn = await contracts.TestGriefing.instance
        .from(buyer)
        .grief(buyer, seller, punishment, Buffer.from(message))
      const receipt = await contracts.TestGriefing.instance.verboseWaitForTransaction(
        txn,
      )

      const griefedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === 'Griefed',
        'There is no such event',
      )

      assert.isDefined(griefedEvent)
      assert.equal(griefedEvent.args.punisher, buyer)
      assert.equal(griefedEvent.args.staker, seller)
      assert.equal(
        griefedEvent.args.punishment.toString(),
        punishment.toString(),
      )
      assert.equal(griefedEvent.args.cost.toString(), expectedCost.toString())
      assert.equal(griefedEvent.args.message, hexlify(message))

      const griefCost = await contracts.TestGriefing.instance.getGriefCost()
      assert.equal(griefCost.toString(), expectedCost.toString())
    })
  })
})
