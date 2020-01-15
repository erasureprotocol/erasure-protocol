const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const ErasureHelper = require('@erasure/crypto-ipfs')
const { assertEvent2 } = require('../helpers/utils')

// global
var g = {}

describe('Deposit', async () => {
  // wallets and addresses
  const spender = accounts[0].signer.address
  const owner = accounts[1].signer.address
  const other = accounts[2].signer.address

  const artifact = require('../../build/TestDeposit.json')

  // shared params
  const amountTokens = ethers.utils.parseEther('5')

  // ABICoder
  const AbiCoder = new ethers.utils.AbiCoder()

  let TestDeposit

  before(async () => {
    // deploy contract
    TestDeposit = await deployer.deploy(artifact)
    // snapshot state
    g.initSnapshot = await utils.snapshot(deployer.provider)
  })

  describe('Deposit._increaseDeposit', async () => {
    it('should deposit DAI', async () => {
      // execute tx
      const txn = await TestDeposit.increaseDeposit(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        owner,
        amountTokens.mul(2),
      )
      const result = await TestDeposit.verboseWaitForTransaction(
        txn,
        '_increaseDeposit()',
      )

      // validate events
      await assertEvent2(result, TestDeposit, 'DepositIncreased', 0, {
        tokenID: ErasureHelper.constants.TOKEN_TYPES.DAI,
        user: owner,
        amount: amountTokens.mul(2),
        newDeposit: amountTokens.mul(2),
      })
    })
  })

  describe('Deposit._decreaseDeposit', async () => {
    it('should revert when deposit too low', async () => {
      await assert.revertWith(
        TestDeposit.decreaseDeposit(
          ErasureHelper.constants.TOKEN_TYPES.DAI,
          owner,
          amountTokens.mul(3),
        ),
        'insufficient deposit to remove',
      )
    })
    it('should withdraw DAI', async () => {
      // execute tx
      const txn = await TestDeposit.decreaseDeposit(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        owner,
        amountTokens,
      )
      const result = await TestDeposit.verboseWaitForTransaction(
        txn,
        '_decreaseDeposit()',
      )

      // validate events
      await assertEvent2(result, TestDeposit, 'DepositDecreased', 0, {
        tokenID: ErasureHelper.constants.TOKEN_TYPES.DAI,
        user: owner,
        amount: amountTokens,
        newDeposit: amountTokens,
      })
    })
  })

  describe('Deposit.getDeposit', async () => {
    it('should get DAI', async () => {
      assert.equal(
        (
          await TestDeposit._getDeposit(
            ErasureHelper.constants.TOKEN_TYPES.DAI,
            owner,
          )
        ).toString(),
        amountTokens.toString(),
      )
    })
    it('should get NMR', async () => {
      assert.equal(
        await TestDeposit._getDeposit(
          ErasureHelper.constants.TOKEN_TYPES.NMR,
          owner,
        ),
        (0).toString(),
      )
    })
  })

  describe('Deposit._clearDeposit', async () => {
    it('should clear DAI', async () => {
      // execute tx
      const txn = await TestDeposit.clearDeposit(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        owner,
      )
      const result = await TestDeposit.verboseWaitForTransaction(
        txn,
        '_decreaseDeposit()',
      )

      // validate events
      await assertEvent2(result, TestDeposit, 'DepositDecreased', 0, {
        tokenID: ErasureHelper.constants.TOKEN_TYPES.DAI,
        user: owner,
        amount: amountTokens,
        newDeposit: 0,
      })
    })
  })
})
