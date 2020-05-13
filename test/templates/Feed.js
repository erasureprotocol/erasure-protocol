const etherlime = require('etherlime-lib')
const ErasureHelper = require('@erasure/crypto-ipfs')
const {
  hexlify,
  abiEncodeWithSelector,
  assertEvent,
} = require('../helpers/utils')

// artifacts
const TestFeedArtifact = require('../../build/Feed.json')
const FeedFactoryArtifact = require('../../build/ErasureFactory.json')
const ErasurePostsArtifact = require('../../build/Erasure_Posts.json')

// global
var g = {}

describe('Feed', async () => {
  // wallets and addresses
  const [creatorWallet, otherWallet, operatorWallet] = accounts
  const creator = creatorWallet.signer.signingKey.address
  const other = otherWallet.signer.signingKey.address
  const operator = operatorWallet.signer.signingKey.address

  // local Post array
  let posts = []
  const addPost = (proofHash, metadata) => {
    const postID = posts.push({ proofHash, metadata }) - 1
    return postID
  }

  // post variables
  const feedMetadata = await ErasureHelper.multihash({
    input: 'feedMetadata',
    inputType: 'raw',
    outputType: 'hex',
  })
  const newFeedMetadata = await ErasureHelper.multihash({
    input: 'newFeedMetadata',
    inputType: 'raw',
    outputType: 'hex',
  })
  const proofHash = await ErasureHelper.multihash({
    input: 'proofHash',
    inputType: 'raw',
    outputType: 'digest',
  })
  const tokenID = ErasureHelper.constants.TOKEN_TYPES.NMR

  const deployTestFeed = async (
    validInit = true,
    args = [operator, feedMetadata],
  ) => {
    let callData

    if (validInit) {
      callData = abiEncodeWithSelector('initialize', ['address', 'bytes'], args)
      const postID = addPost(proofHash)
    } else {
      // invalid callData is missing first address
      callData = abiEncodeWithSelector('initialize', ['bytes'], [feedMetadata])
    }

    const txn = await this.FeedFactory.from(creator).create(callData)
    const receipt = await this.FeedFactory.verboseWaitForTransaction(txn)
    const expectedEvent = 'InstanceCreated'
    const createFeedEvent = receipt.events.find(
      emittedEvent => emittedEvent.event === expectedEvent,
      'There is no such event',
    )
    // parse event logs to get new instance address
    // use new instance address to create contract object
    const feedAddress = createFeedEvent.args.instance
    if (!validInit) {
      assert.equal(feedAddress, undefined)
    } else {
      const feedContract = deployer.wrapDeployedContract(
        TestFeedArtifact,
        feedAddress,
      )
      return feedContract
    }
  }
  const deployDeactivatedFeed = async () => {
    const feed = await deployTestFeed()
    await feed.from(operator).renounceOperator()
    return feed
  }

  before(async () => {
    g.Token = NMR

    this.PostRegistry = await deployer.deploy(ErasurePostsArtifact)

    this.FeedTemplate = await deployer.deploy(TestFeedArtifact)

    this.FeedFactory = await deployer.deploy(
      FeedFactoryArtifact,
      false,
      this.PostRegistry.contractAddress,
      this.FeedTemplate.contractAddress,
    )

    await this.PostRegistry.from(deployer.signer).addFactory(
      this.FeedFactory.contractAddress,
      '0x',
    )
    this.DeactivatedFeed = await deployDeactivatedFeed()
  })

  describe('Feed.initialize', () => {
    it('should revert when initialize with malformed init data', async () => {
      await assert.revert(deployTestFeed(false))
    })

    it('should initialize feed', async () => {
      this.TestFeed = await deployTestFeed(true)

      // Operator._setOperator
      const getOperator = await this.TestFeed.getOperator()
      assert.equal(getOperator, operator)
    })
  })

  describe('Feed.submitHash', () => {
    // check operator access control
    it('should revert when msg.sender is not operator or creator', async () => {
      // Factory has to be the sender here
      await assert.revertWith(
        this.TestFeed.from(other).submitHash(proofHash),
        'only operator or creator',
      )
    })

    // check deactivated operator
    it('should revert when msg.sender is operator but not active', async () => {
      await assert.revertWith(
        this.DeactivatedFeed.from(operator).submitHash(proofHash),
        'only operator or creator',
      )
    })

    // success case
    it('should submit hash successfully from creator', async () => {
      const hash = ethers.utils.keccak256(hexlify('proofHash1'))
      const postID = addPost(hash)

      const txn = await this.TestFeed.from(creator).submitHash(hash)
      assertEvent(this.TestFeed, txn, 'HashSubmitted', [hash])
    })

    it('should submit hash successfully from operator', async () => {
      const hash = ethers.utils.keccak256(hexlify('proofHash2'))
      const postID = addPost(hash)

      const txn = await this.TestFeed.from(operator).submitHash(hash)
      assertEvent(this.TestFeed, txn, 'HashSubmitted', [hash])
    })
  })

  describe('Feed.depositStake', async () => {
    const amount = ethers.utils.parseEther('10')

    it('should mint mock tokens', async () => {
      // mint tokens
      await g.Token.mintMockTokens(other, amount)
      await g.Token.from(other).approve(this.TestFeed.contractAddress, amount)
      await g.Token.mintMockTokens(operator, amount)
      await g.Token.from(operator).approve(
        this.TestFeed.contractAddress,
        amount,
      )
      await g.Token.mintMockTokens(creator, amount)
      await g.Token.from(creator).approve(this.TestFeed.contractAddress, amount)
    })

    it('should revert when msg.sender is not operator or creator', async () => {
      // check operator access control
      await assert.revertWith(
        this.TestFeed.from(other).depositStake(tokenID, amount),
        'only operator or creator',
      )
    })

    it('should revert when msg.sender is operator but not active', async () => {
      // check deactivated operator
      await assert.revertWith(
        this.DeactivatedFeed.from(operator).depositStake(tokenID, amount),
        'only operator or creator',
      )
    })

    it('should deposit successfully from creator', async () => {
      // success case
      const txn = await this.TestFeed.from(creator).depositStake(
        tokenID,
        amount,
      )
      await assert.emitWithArgs(txn, 'DepositIncreased', [
        tokenID,
        creator,
        amount,
        amount,
      ])
      assert.equal(
        (await g.Token.balanceOf(this.TestFeed.contractAddress)).toString(),
        amount.toString(),
      )
      assert.equal(
        (await this.TestFeed.getStake(tokenID)).toString(),
        amount.toString(),
      )
      // await assert.emitWithArgs(txn, 'Transfer', [
      //   this.TestFeed.contractAddress,
      //   creator,
      //   amount,
      // ])
    })

    it('should deposit successfully from operator', async () => {
      const txn = await this.TestFeed.from(operator).depositStake(
        tokenID,
        amount,
      )
      await assert.emitWithArgs(txn, 'DepositIncreased', [
        tokenID,
        creator,
        amount,
        amount * 2,
      ])
      assert.equal(
        (await g.Token.balanceOf(this.TestFeed.contractAddress)).toString(),
        (amount * 2).toString(),
      )
      assert.equal(
        (await this.TestFeed.getStake(tokenID)).toString(),
        (amount * 2).toString(),
      )
      // assertEvent(g.Token, txn, 'Transfer', [
      //   this.TestFeed.contractAddress,
      //   operator,
      //   amount,
      // ])
    })
  })

  describe('Feed.withdrawStake', async () => {
    const amount = ethers.utils.parseEther('10')

    it('should revert when msg.sender is not operator or creator', async () => {
      // check operator access control
      await assert.revertWith(
        this.TestFeed.from(other).withdrawStake(tokenID, amount),
        'only operator or creator',
      )
    })

    it('should revert when msg.sender is operator but not active', async () => {
      // check deactivated operator
      await assert.revertWith(
        this.DeactivatedFeed.from(operator).withdrawStake(tokenID, amount),
        'only operator or creator',
      )
    })

    it('should withdraw successfully from creator', async () => {
      // success case
      const txn = await this.TestFeed.from(creator).withdrawStake(
        tokenID,
        amount,
      )
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        creator,
        amount,
        amount,
      ])
      assert.equal(
        (await g.Token.balanceOf(this.TestFeed.contractAddress)).toString(),
        amount.toString(),
      )
      assert.equal(
        (await this.TestFeed.getStake(tokenID)).toString(),
        amount.toString(),
      )
      // await assert.emitWithArgs(txn, 'Transfer', [
      //   this.TestFeed.contractAddress,
      //   creator,
      //   amount,
      // ])
    })

    it('should withdraw successfully from operator', async () => {
      const txn = await this.TestFeed.from(operator).withdrawStake(
        tokenID,
        amount,
      )
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        creator,
        amount,
        0,
      ])
      assert.equal(
        (await g.Token.balanceOf(this.TestFeed.contractAddress)).toNumber(),
        0,
      )
      assert.equal((await this.TestFeed.getStake(tokenID)).toNumber(), 0)
      // assertEvent(g.Token, txn, 'Transfer', [
      //   this.TestFeed.contractAddress,
      //   operator,
      //   amount,
      // ])
    })
  })

  describe('Feed.setMetadata', () => {
    it('should revert when msg.sender not operator or creator', async () => {
      await assert.revertWith(
        this.TestFeed.from(other).setMetadata(newFeedMetadata),
        'only operator or creator',
      )
    })

    it('should revert when msg.sender is operator but not active', async () => {
      await assert.revertWith(
        this.DeactivatedFeed.from(operator).setMetadata(newFeedMetadata),
        'only operator or creator',
      )
    })

    it('should set feed metadata from operator when active', async () => {
      const txn = await this.TestFeed.from(operator).setMetadata(
        newFeedMetadata,
      )
      await assert.emitWithArgs(txn, 'MetadataSet', [newFeedMetadata])
    })

    it('should set feed metadata from creator', async () => {
      const txn = await this.TestFeed.from(creator).setMetadata(newFeedMetadata)
      await assert.emitWithArgs(txn, 'MetadataSet', [newFeedMetadata])
    })
  })
})
