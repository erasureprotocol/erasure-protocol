const etherlime = require('etherlime-lib')
const ethers = require('ethers')

const ErasureHelper = require('@erasure/crypto-ipfs')
const {
  hexlify,
  abiEncodeWithSelector,
  assertEvent,
} = require('../helpers/utils')

// global
var g = {}

describe('BurnDAI', function() {
  // wallets and addresses
  const user = accounts[0].signer.signingKey.address

  // shared params

  // ABICoder
  const AbiCoder = new ethers.utils.AbiCoder()

  before(async function() {
    // snapshot state
    g.initSnapshot = await utils.snapshot(deployer.provider)
  })

  describe('BurnDAI._burnFrom', async function() {
    it('should fail if no approval', async function() {})

    it('should fail if not enough tokens', async function() {})

    it('should succeed', async function() {})
  })

  describe('BurnDAI._burn', function() {
    it('should fail if not enough tokens', async function() {})

    it('should succeed', async function() {})
  })
})
