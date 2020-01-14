const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const ErasureHelper = require('@erasure/crypto-ipfs')
const { assertEvent2 } = require('../helpers/utils')

// global
var g = {}

describe('BurnDAI', async () => {
  // wallets and addresses
  const spender = accounts[0].signer.address
  const owner = accounts[1].signer.address
  const other = accounts[2].signer.address

  const artifact = require('../../build/TestBurnDAI.json')

  // shared params
  const amountToBurn = ethers.utils.parseEther('5')

  // ABICoder
  const AbiCoder = new ethers.utils.AbiCoder()

  let TestBurnDAI

  before(async () => {
    // deploy contract
    TestBurnDAI = await deployer.deploy(artifact)
    // snapshot state
    g.initSnapshot = await utils.snapshot(deployer.provider)
  })

  describe('BurnDAI._burnFrom', async () => {
    it('should fail if not enough tokens', async () => {
      // check for revert
      assert.revertWith(
        TestBurnDAI.from(spender).burnFrom(owner, amountToBurn),
        'ERC20: transfer amount exceeds balance',
      )
    })

    it('should fail if no approval', async () => {
      // mint tokens
      await DAI.mintMockTokens(owner, amountToBurn)

      // check for revert
      assert.revertWith(
        TestBurnDAI.from(spender).burnFrom(owner, amountToBurn),
        'ERC20: transfer amount exceeds allowance',
      )
    })

    it('should succeed', async () => {
      // get expected amounts
      const expectedETH = await UniswapDAI.getTokenToEthInputPrice(amountToBurn)
      const expectedNMR = await UniswapNMR.getEthToTokenInputPrice(expectedETH)

      // approve
      await DAI.from(owner).approve(TestBurnDAI.contractAddress, amountToBurn)

      // execute burn
      const txn = await TestBurnDAI.from(spender).burnFrom(owner, amountToBurn)
      const result = await TestBurnDAI.verboseWaitForTransaction(
        txn,
        'burnFrom()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 0, {
        from: owner,
        to: TestBurnDAI.contractAddress,
        value: amountToBurn,
      })
      await assertEvent2(result, DAI, 'Transfer', 1, {
        from: TestBurnDAI.contractAddress,
        to: UniswapDAI.contractAddress,
        value: amountToBurn,
      })
      await assertEvent2(result, DAI, 'Transfer', 2, {
        from: UniswapNMR.contractAddress,
        to: TestBurnDAI.contractAddress,
        value: expectedNMR,
      })
      await assertEvent2(result, DAI, 'Transfer', 3, {
        from: TestBurnDAI.contractAddress,
        to: ethers.constants.AddressZero,
        value: expectedNMR,
      })

      await assertEvent2(result, UniswapDAI, 'EthPurchase', 0, {
        buyer: TestBurnDAI.contractAddress,
        tokens_sold: amountToBurn,
        eth_bought: expectedETH,
      })

      await assertEvent2(result, UniswapDAI, 'TokenPurchase', 0, {
        buyer: UniswapDAI.contractAddress,
        eth_sold: expectedETH,
        tokens_bought: expectedNMR,
      })
    })
  })

  describe('BurnDAI._burn', function() {
    it('should fail if not enough tokens', async () => {
      // check for revert
      assert.revertWith(
        TestBurnDAI.from(owner).burn(amountToBurn),
        'ERC20: transfer amount exceeds balance',
      )
    })

    it('should succeed', async () => {
      // get expected amounts
      const expectedETH = await UniswapDAI.getTokenToEthInputPrice(amountToBurn)
      const expectedNMR = await UniswapNMR.getEthToTokenInputPrice(expectedETH)

      // mint tokens
      await DAI.mintMockTokens(TestBurnDAI.contractAddress, amountToBurn)

      // execute burn
      const txn = await TestBurnDAI.from(owner).burn(amountToBurn)
      const result = await TestBurnDAI.verboseWaitForTransaction(txn, 'burn()')

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 0, {
        from: TestBurnDAI.contractAddress,
        to: UniswapDAI.contractAddress,
        value: amountToBurn,
      })
      await assertEvent2(result, DAI, 'Transfer', 1, {
        from: UniswapNMR.contractAddress,
        to: TestBurnDAI.contractAddress,
        value: expectedNMR,
      })
      await assertEvent2(result, DAI, 'Transfer', 2, {
        from: TestBurnDAI.contractAddress,
        to: ethers.constants.AddressZero,
        value: expectedNMR,
      })

      await assertEvent2(result, UniswapDAI, 'EthPurchase', 0, {
        buyer: TestBurnDAI.contractAddress,
        tokens_sold: amountToBurn,
        eth_bought: expectedETH,
      })

      await assertEvent2(result, UniswapDAI, 'TokenPurchase', 0, {
        buyer: UniswapDAI.contractAddress,
        eth_sold: expectedETH,
        tokens_bought: expectedNMR,
      })
    })
  })
})
