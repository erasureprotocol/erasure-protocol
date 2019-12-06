// require artifacts
const FeedArtifact = require('../../build/Feed.json')
const FeedFactoryArtifact = require('../../build/Feed_Factory.json')
const ErasureAgreementsArtifact = require('../../build/Erasure_Agreements.json')
const ErasurePostsArtifact = require('../../build/Erasure_Posts.json')

// test helpers
const { createDeployer } = require('../helpers/setup')
const testFactory = require('../modules/Factory')
const [, , creatorWallet] = accounts
const creator = creatorWallet.signer.signingKey.address

// variables used in initialize()
const factoryName = 'Feed_Factory'
const instanceType = 'Post'
const staticMetadata = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes('staticMetadata'),
)

const createTypes = ['address', 'bytes32', 'bytes']

let FeedTemplate
let deployer

before(async () => {
  deployer = createDeployer()
  FeedTemplate = await deployer.deploy(FeedArtifact)
})

function runFactoryTest() {
  describe(factoryName, () => {
    it('setups test', () => {
      const createArgs = [creator, ethers.constants.HashZero, staticMetadata]

      testFactory(
        deployer,
        factoryName,
        instanceType,
        createTypes,
        createArgs,
        FeedFactoryArtifact,
        ErasurePostsArtifact, // correct registry
        ErasureAgreementsArtifact, // wrong registry
        [FeedTemplate.contractAddress],
      )
    })
  })
}

runFactoryTest()
