const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const ErasureHelper = require('@erasure/crypto-ipfs')
const { assertEvent2 } = require('../helpers/utils')

// global
var g = {}

describe('TokenManager', async () => {
  // wallets and addresses
  const spender = accounts[0].signer.address
  const owner = accounts[1].signer.address
  const other = accounts[2].signer.address

  const artifact = require('../../build/TestTokenManager.json')

  // shared params
  const amountTokens = ethers.utils.parseEther('5')

  // ABICoder
  const AbiCoder = new ethers.utils.AbiCoder()

  let TestTokenManager

  before(async () => {
    // deploy contract
    TestTokenManager = await deployer.deploy(artifact)
    // snapshot state
    g.initSnapshot = await utils.snapshot(deployer.provider)
  })

  describe('TokenManager._transfer', async () => {
    it('should transter DAI', async () => {
      // mint tokens
      await DAI.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // execute tx
      const txn = await TestTokenManager.transfer(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_transfer()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 0, {
        from: TestTokenManager.contractAddress,
        to: other,
        value: amountTokens,
      })
    })
    it('should transter NMR', async () => {
      // mint tokens
      await NMR.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // execute tx
      const txn = await TestTokenManager.transfer(
        ErasureHelper.constants.TOKEN_TYPES.NMR,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_transfer()',
      )

      // validate events
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: TestTokenManager.contractAddress,
        to: other,
        value: amountTokens,
      })
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager.transfer(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          other,
          amountTokens,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager._burn', async () => {
    it('should burn DAI', async () => {
      // mint tokens
      await DAI.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // get expected amounts
      const expectedETH = await UniswapDAI.getTokenToEthInputPrice(amountTokens)
      const expectedNMR = await UniswapNMR.getEthToTokenInputPrice(expectedETH)

      // execute tx
      const txn = await TestTokenManager.burn(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_burn()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 2, {
        from: TestTokenManager.contractAddress,
        to: ethers.constants.AddressZero,
        value: expectedNMR,
      })
      await assertEvent2(result, UniswapDAI, 'EthPurchase', 0, {
        buyer: TestTokenManager.contractAddress,
        tokens_sold: amountTokens,
        eth_bought: expectedETH,
      })
      await assertEvent2(result, UniswapDAI, 'TokenPurchase', 0, {
        buyer: UniswapDAI.contractAddress,
        eth_sold: expectedETH,
        tokens_bought: expectedNMR,
      })
    })
    it('should burn NMR', async () => {
      // mint tokens
      await NMR.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // execute tx
      const txn = await TestTokenManager.burn(
        ErasureHelper.constants.TOKEN_TYPES.NMR,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_burn()',
      )

      // validate events
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: TestTokenManager.contractAddress,
        to: ethers.constants.AddressZero,
        value: amountTokens,
      })
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager.burn(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          amountTokens,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager._approve', async () => {
    it('should approve DAI', async () => {
      // mint tokens
      await DAI.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // execute tx
      const txn = await TestTokenManager.approve(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_approve()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Approval', 0, {
        owner: TestTokenManager.contractAddress,
        spender: other,
        value: amountTokens,
      })

      const txn2 = await DAI.from(other).transferFrom(
        TestTokenManager.contractAddress,
        other,
        amountTokens,
      )
      const result2 = await TestTokenManager.verboseWaitForTransaction(
        txn2,
        'transferFrom()',
      )

      // validate events
      await assertEvent2(result2, DAI, 'Transfer', 0, {
        from: TestTokenManager.contractAddress,
        to: other,
        value: amountTokens,
      })
      await assertEvent2(result2, DAI, 'Approval', 0, {
        owner: TestTokenManager.contractAddress,
        spender: other,
        value: 0,
      })
    })
    it('should approve NMR', async () => {
      // mint tokens
      await NMR.mintMockTokens(TestTokenManager.contractAddress, amountTokens)

      // execute tx
      const txn = await TestTokenManager.approve(
        ErasureHelper.constants.TOKEN_TYPES.NMR,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_approve()',
      )

      // validate events
      await assertEvent2(result, NMR, 'Approval', 0, {
        owner: TestTokenManager.contractAddress,
        spender: other,
        value: amountTokens,
      })

      const txn2 = await NMR.from(other).transferFrom(
        TestTokenManager.contractAddress,
        other,
        amountTokens,
      )
      const result2 = await TestTokenManager.verboseWaitForTransaction(
        txn2,
        'transferFrom()',
      )

      // validate events
      await assertEvent2(result2, NMR, 'Transfer', 0, {
        from: TestTokenManager.contractAddress,
        to: other,
        value: amountTokens,
      })
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager.approve(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          other,
          amountTokens,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager._transferFrom', async () => {
    it('should transter DAI', async () => {
      // mint tokens
      await DAI.mintMockTokens(owner, amountTokens)

      // mint tokens
      await DAI.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )

      // execute tx
      const txn = await TestTokenManager.transferFrom(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        owner,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_transferFrom()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 0, {
        from: owner,
        to: other,
        value: amountTokens,
      })
      await assertEvent2(result, DAI, 'Approval', 0, {
        owner: owner,
        spender: TestTokenManager.contractAddress,
        value: 0,
      })
    })
    it('should transter NMR', async () => {
      // mint tokens
      await NMR.mintMockTokens(owner, amountTokens)

      // mint tokens
      await NMR.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )

      // execute tx
      const txn = await TestTokenManager.transferFrom(
        ErasureHelper.constants.TOKEN_TYPES.NMR,
        owner,
        other,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_transferFrom()',
      )

      // validate events
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: owner,
        to: other,
        value: amountTokens,
      })
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager.transferFrom(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          owner,
          other,
          amountTokens,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager._burnFrom', async () => {
    it('should burn DAI', async () => {
      // get expected amounts
      const expectedETH = await UniswapDAI.getTokenToEthInputPrice(amountTokens)
      const expectedNMR = await UniswapNMR.getEthToTokenInputPrice(expectedETH)

      // mint tokens
      await DAI.mintMockTokens(owner, amountTokens)
      await DAI.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )

      // execute tx
      const txn = await TestTokenManager.burnFrom(
        ErasureHelper.constants.TOKEN_TYPES.DAI,
        owner,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_burnFrom()',
      )

      // validate events
      await assertEvent2(result, DAI, 'Transfer', 3, {
        from: TestTokenManager.contractAddress,
        to: ethers.constants.AddressZero,
        value: expectedNMR,
      })
      await assertEvent2(result, UniswapDAI, 'EthPurchase', 0, {
        buyer: TestTokenManager.contractAddress,
        tokens_sold: amountTokens,
        eth_bought: expectedETH,
      })
      await assertEvent2(result, UniswapDAI, 'TokenPurchase', 0, {
        buyer: UniswapDAI.contractAddress,
        eth_sold: expectedETH,
        tokens_bought: expectedNMR,
      })
    })
    it('should burn NMR', async () => {
      // mint tokens
      await NMR.mintMockTokens(owner, amountTokens)
      await NMR.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )

      // execute tx
      const txn = await TestTokenManager.burnFrom(
        ErasureHelper.constants.TOKEN_TYPES.NMR,
        owner,
        amountTokens,
      )
      const result = await TestTokenManager.verboseWaitForTransaction(
        txn,
        '_burnFrom()',
      )

      // validate events
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: owner,
        to: ethers.constants.AddressZero,
        value: amountTokens,
      })
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager.burnFrom(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          owner,
          amountTokens,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager.getTokenAddress', async () => {
    it('should get DAI', async () => {
      assert.equal(
        await TestTokenManager.getTokenAddress(
          ErasureHelper.constants.TOKEN_TYPES.DAI,
        ),
        DAI.contractAddress,
      )
    })
    it('should get NMR', async () => {
      assert.equal(
        await TestTokenManager.getTokenAddress(
          ErasureHelper.constants.TOKEN_TYPES.NMR,
        ),
        NMR.contractAddress,
      )
    })
    it('should return address(0) for invalid token', async () => {
      assert.equal(
        await TestTokenManager.getTokenAddress(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
        ),
        ethers.constants.AddressZero,
      )
    })
  })

  describe('TokenManager.isValidTokenID', async () => {
    it('should get DAI', async () => {
      assert(
        await TestTokenManager._isValidTokenID(
          ErasureHelper.constants.TOKEN_TYPES.DAI,
        ),
      )
    })
    it('should get NMR', async () => {
      assert(
        await TestTokenManager._isValidTokenID(
          ErasureHelper.constants.TOKEN_TYPES.NMR,
        ),
      )
    })
    it('should return false for invalid token', async () => {
      assert.equal(
        await TestTokenManager._isValidTokenID(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
        ),
        false,
      )
    })
  })

  describe('TokenManager.totalSupply', async () => {
    it('should get DAI', async () => {
      assert.equal(
        (
          await TestTokenManager._totalSupply(
            ErasureHelper.constants.TOKEN_TYPES.DAI,
          )
        ).toString(),
        (await DAI.totalSupply()).toString(),
      )
    })
    it('should get NMR', async () => {
      assert.equal(
        (
          await TestTokenManager._totalSupply(
            ErasureHelper.constants.TOKEN_TYPES.NMR,
          )
        ).toString(),
        (await NMR.totalSupply()).toString(),
      )
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager._totalSupply(ErasureHelper.constants.TOKEN_TYPES.NaN),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager.balanceOf', async () => {
    it('should get DAI', async () => {
      assert.equal(
        (
          await TestTokenManager._balanceOf(
            ErasureHelper.constants.TOKEN_TYPES.DAI,
            other,
          )
        ).toString(),
        (await DAI.balanceOf(other)).toString(),
      )
    })
    it('should get NMR', async () => {
      assert.equal(
        (
          await TestTokenManager._balanceOf(
            ErasureHelper.constants.TOKEN_TYPES.NMR,
            other,
          )
        ).toString(),
        (await NMR.balanceOf(other)).toString(),
      )
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager._balanceOf(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          other,
        ),
        'invalid tokenID',
      )
    })
  })

  describe('TokenManager.allowance', async () => {
    it('should get DAI', async () => {
      await DAI.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )
      assert.equal(
        (
          await TestTokenManager._allowance(
            ErasureHelper.constants.TOKEN_TYPES.DAI,
            owner,
            TestTokenManager.contractAddress,
          )
        ).toString(),
        amountTokens.toString(),
      )
    })
    it('should get NMR', async () => {
      await NMR.from(owner).approve(
        TestTokenManager.contractAddress,
        amountTokens,
      )
      assert.equal(
        (
          await TestTokenManager._allowance(
            ErasureHelper.constants.TOKEN_TYPES.NMR,
            owner,
            TestTokenManager.contractAddress,
          )
        ).toString(),
        amountTokens.toString(),
      )
    })
    it('should revert with invalid token', async () => {
      await assert.revertWith(
        TestTokenManager._allowance(
          ErasureHelper.constants.TOKEN_TYPES.NaN,
          owner,
          TestTokenManager.contractAddress,
        ),
        'invalid tokenID',
      )
    })
  })
})
