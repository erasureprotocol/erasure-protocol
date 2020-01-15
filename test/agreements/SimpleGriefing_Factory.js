// require artifacts
const SimpleGriefing_FactoryArtifact = require('../../build/SimpleGriefing_Factory.json')
const SimpleGriefingArtifact = require('../../build/SimpleGriefing.json')
const MockNMRArtifact = require('../../build/MockNMR.json')
const ErasureAgreementsRegistryArtifact = require('../../build/Erasure_Agreements.json')
const ErasurePostsRegistryArtifact = require('../../build/Erasure_Posts.json')

// test helpers
const testFactory = require('../modules/Factory')
const { RATIO_TYPES, TOKEN_TYPES } = require('../helpers/variables')

// variables used in initialize()
const tokenID = TOKEN_TYPES.NMR
const factoryName = 'SimpleGriefing_Factory'
const instanceType = 'Agreement'
const ratio = ethers.utils.parseEther('2')
const ratioType = RATIO_TYPES.Dec
const staticMetadata = 'TESTING'

const createTypes = [
  'address',
  'address',
  'address',
  'uint8',
  'uint256',
  'uint8',
  'bytes',
]

let SimpleGriefing

before(async () => {
  SimpleGriefing = await deployer.deploy(SimpleGriefingArtifact)
})

function runFactoryTest() {
  const [ownerWallet, stakerWallet, counterpartyWallet] = accounts
  const owner = ownerWallet.signer.signingKey.address
  const staker = stakerWallet.signer.signingKey.address
  const counterparty = counterpartyWallet.signer.signingKey.address

  describe(factoryName, () => {
    it('setups test', () => {
      const createArgs = [
        owner,
        staker,
        counterparty,
        tokenID,
        ratio,
        ratioType,
        Buffer.from(staticMetadata),
      ]

      testFactory(
        deployer,
        'SimpleGriefing_Factory',
        instanceType,
        createTypes,
        createArgs,
        SimpleGriefing_FactoryArtifact,
        ErasureAgreementsRegistryArtifact,
        ErasurePostsRegistryArtifact,
        [SimpleGriefing.contractAddress],
      )
    })
  })
}

runFactoryTest()
