const etherlime = require('etherlime-lib')
const ethers = require('ethers')

const { RATIO_TYPES, TOKEN_TYPES } = require('../helpers/variables')
const {
  hexlify,
  abiEncodeWithSelector,
  assertEvent,
  assertEvent2,
} = require('../helpers/utils')

const artifact = require('../../build/BurnRewards.json')

describe('BurnRewards', function() {
  // ABICoder
  const AbiCoder = new ethers.utils.AbiCoder()

  // wallets and addresses
  const burner = accounts[0].signer.signingKey.address
  const rewardRecipient = accounts[1].signer.signingKey.address
  const creator = accounts[2].signer.signingKey.address

  // shared params
  const rewardRatio = 3
  const rewardPool = ethers.utils.parseEther('1000000')
  const burnAmount = ethers.utils.parseEther('30')

  describe('Happy Path', async function() {
    it('creator should successfully deploy contract', async function() {
      const burnRewards = await deployer.deploy(artifact, false, rewardRatio)
    })
    it('creator should successfully deposit NMR in reward pool', async function() {
      const burnRewards = await deployer.deploy(artifact, false, rewardRatio)

      // mint NMR
      await NMR.mintMockTokens(creator, rewardPool)

      // deposit reward pool
      const result = await NMR.verboseWaitForTransaction(
        await NMR.from(creator).transfer(
          burnRewards.contractAddress,
          rewardPool,
        ),
        'transfer()',
      )

      // validate
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: creator,
        to: burnRewards.contractAddress,
        value: rewardPool,
      })
    })
    it('burner should successfully claim reward', async function() {
      const burnRewards = await deployer.deploy(artifact, false, rewardRatio)

      // mint NMR
      await NMR.mintMockTokens(creator, rewardPool)

      // deposit reward pool
      await NMR.from(creator).transfer(burnRewards.contractAddress, rewardPool)

      // burn and claim reward
      await NMR.mintMockTokens(burner, burnAmount)
      await NMR.from(burner).approve(burnRewards.contractAddress, 0)
      await NMR.from(burner).approve(burnRewards.contractAddress, burnAmount)
      const result = await burnRewards.verboseWaitForTransaction(
        await burnRewards
          .from(burner)
          .burnAndClaim(burnAmount, rewardRecipient),
        'burnAndClaim()',
      )

      // validate
      await assertEvent2(result, NMR, 'Transfer', 0, {
        from: burner,
        to: ethers.constants.AddressZero,
        value: burnAmount,
      })
      await assertEvent2(result, NMR, 'Transfer', 1, {
        from: burnRewards.contractAddress,
        to: rewardRecipient,
        value: burnAmount.div(rewardRatio),
      })
      await assertEvent2(result, burnRewards, 'RewardClaimed', 0, {
        source: burner,
        recipient: rewardRecipient,
        burnAmount: burnAmount,
        rewardAmount: burnAmount.div(rewardRatio),
      })
    })
  })
  describe('Reverts', async function() {
    it('should revert on deployment with reward ratio of 0', async function() {
      await assert.revertWith(
        deployer.deploy(artifact, false, 0),
        'BurnRewards: ratio cannot be zero',
      )
    })
    it('should revert on burnAndClaim if recipient undefined', async function() {
      const burnRewards = await deployer.deploy(artifact, false, rewardRatio)

      // mint NMR
      await NMR.mintMockTokens(creator, rewardPool)

      // deposit reward pool
      await NMR.from(creator).transfer(burnRewards.contractAddress, rewardPool)

      // burn and claim reward
      await NMR.mintMockTokens(burner, burnAmount)
      await NMR.from(burner).approve(burnRewards.contractAddress, 0)
      await NMR.from(burner).approve(burnRewards.contractAddress, burnAmount)
      await assert.revertWith(
        burnRewards
          .from(burner)
          .burnAndClaim(burnAmount, ethers.constants.AddressZero),
        'BurnRewards/burnAndClaim: rewardRecipient cannot be zero',
      )
    })
  })
})
