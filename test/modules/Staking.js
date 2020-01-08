const { initDeployment } = require('../helpers/setup')
const { TOKEN_TYPES } = require('../helpers/variables')

describe('Staking', function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2],
  }

  let contracts = {
    TestStaking: {
      artifact: require('../../build/TestStaking.json'),
    },
    MockNMR: {
      artifact: require('../../build/MockNMR.json'),
    },
  }

  let deployer
  before(async () => {
    ;[this.deployer, this.MockNMR] = await initDeployment()
    deployer = this.deployer
  })

  beforeEach(async () => {
    contracts.TestStaking.instance = await deployer.deploy(
      contracts.TestStaking.artifact,
    )
  })

  describe('Staking._addStake', () => {
    // funder has funds to fund for the staker's stake
    const staker = wallets.seller.signer.signingKey.address
    const funder = wallets.numerai.signer.signingKey.address
    const tokenID = TOKEN_TYPES.NMR

    it('should fail when no allowance', async () => {
      await assert.revertWith(
        contracts.TestStaking.instance.addStake(tokenID, staker, funder, 10),
        'insufficient allowance',
      )
    })

    // it("should fail when currentStake is wrong", async () => {
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // currentStake should begin from 0
    //   await assert.revertWith(
    //     contracts.TestStaking.instance.addStake(staker, funder, 10),
    //     "current stake incorrect"
    //   );

    //   // approve staking contract to transferFrom
    //   await this.MockNMR.from(funder).approve(stakingAddress, 10);

    //   await contracts.TestStaking.instance.addStake(staker, funder, 10);

    //   // // new currentStake should be 10 instead
    //   await assert.revertWith(
    //     contracts.TestStaking.instance.addStake(staker, funder, 10),
    //     "current stake incorrect"
    //   );
    // });

    // it("should fail when amountToAdd is 0", async () => {
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // approve staking contract to transferFrom
    //   await this.MockNMR.from(funder).approve(stakingAddress, 10);

    //   await assert.revertWith(
    //     contracts.TestStaking.instance.addStake(staker, funder, 0),
    //     "no stake to add"
    //   );
    // });

    it('should addStake successfully', async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      const amountToAdd = 10

      // approve staking contract to transferFrom
      await this.MockNMR.from(funder).approve(stakingAddress, amountToAdd)

      const originalBalance = await this.MockNMR.balanceOf(funder)

      // add stake of 10 tokens
      const txn = await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        funder,
        amountToAdd,
      )

      // check receipt for correct event logs
      await assert.emitWithArgs(txn, 'DepositIncreased', [
        tokenID,
        staker,
        amountToAdd,
        amountToAdd,
      ])

      // check updated token balances, 10000 * 10**18 - 10
      const expectedBalance = originalBalance.sub(amountToAdd).toString(10)
      const actualBalance = await this.MockNMR.balanceOf(funder)
      assert.equal(actualBalance.toString(10), expectedBalance)

      // now check the updated token balance of the staking contract
      const stakingBalance = await this.MockNMR.balanceOf(stakingAddress)
      assert.equal(stakingBalance.toString(10), amountToAdd)

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(
        tokenID,
        staker,
      )
      assert.equal(actualStake.toNumber(), amountToAdd)
    })
  })

  describe('Staking._takeStake', () => {
    const staker = wallets.seller.signer.signingKey.address
    const recipient = wallets.numerai.signer.signingKey.address
    const tokenID = TOKEN_TYPES.NMR

    // it("should fail when currentStake is wrong", async () => {
    //   const amountStaked = 10;
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // approve staking contract to transferFrom
    //   await this.MockNMR
    //     .from(recipient)
    //     .approve(stakingAddress, amountStaked);

    //   // add stake of 10 tokens
    //   await contracts.TestStaking.instance.addStake(
    //     staker,
    //     recipient,
    //     amountStaked
    //   );

    //   // should be 10
    //   await assert.revertWith(
    //     contracts.TestStaking.instance.takeStake(
    //       staker,
    //       recipient,
    //       amountStaked
    //     ),
    //     "current stake incorrect"
    //   );
    // });

    // it("should fail when amountToTake is 0", async () => {
    //   const amountStaked = 10;
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // approve staking contract to transferFrom
    //   await this.MockNMR
    //     .from(recipient)
    //     .approve(stakingAddress, amountStaked);

    //   // add stake of 10 tokens
    //   await contracts.TestStaking.instance.addStake(
    //     staker,
    //     recipient,
    //     amountStaked
    //   );

    //   // should be 10
    //   await assert.revertWith(
    //     contracts.TestStaking.instance.takeStake(
    //       staker,
    //       recipient,
    //       0
    //     ),
    //     "no stake to remove"
    //   );
    // });

    it('should fail when amountToTake > currentStake', async () => {
      const amountStaked = 10
      const amountToTake = 20
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      // approve staking contract to transferFrom
      await this.MockNMR.from(recipient).approve(stakingAddress, amountStaked)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        recipient,
        amountStaked,
      )

      // amountToTake > amountStaked
      await assert.revertWith(
        contracts.TestStaking.instance.takeStake(
          tokenID,
          staker,
          recipient,
          amountToTake,
        ),
        'insufficient deposit to remove',
      )
    })

    it('should takeStake successfully', async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      const amountToAdd = 10
      const amountTaken = 5

      // approve staking contract to transferFrom
      await this.MockNMR.from(recipient).approve(stakingAddress, amountToAdd)

      const originalBalance = await this.MockNMR.balanceOf(recipient)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        recipient,
        amountToAdd,
      )

      const txn = await contracts.TestStaking.instance.takeStake(
        tokenID,
        staker,
        recipient,
        amountTaken,
      )

      // check receipt for correct event logs
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        staker,
        amountTaken,
        amountToAdd - amountTaken,
      ])

      // check updated token balances, 10000 * 10**18 - 10
      const expectedBalance = originalBalance.sub(amountTaken).toString(10)
      const actualBalance = await this.MockNMR.balanceOf(recipient)
      assert.equal(actualBalance.toString(10), expectedBalance)

      // now check the updated token balance of the staking contract
      const stakingBalance = await this.MockNMR.balanceOf(stakingAddress)
      assert.equal(stakingBalance.toString(10), amountTaken)

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(
        tokenID,
        staker,
      )
      assert.equal(actualStake.toNumber(), amountTaken)
    })
  })

  describe('Staking._takeFullStake', () => {
    // funder has funds to fund for the staker's stake
    const staker = wallets.seller.signer.signingKey.address
    const recipient = wallets.numerai.signer.signingKey.address
    const tokenID = TOKEN_TYPES.NMR

    it('should takeFullStake successfully', async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      const amountStaked = 10

      // approve staking contract to transferFrom
      await this.MockNMR.from(recipient).approve(stakingAddress, amountStaked)

      const originalBalance = await this.MockNMR.balanceOf(recipient)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        recipient,
        amountStaked,
      )

      const txn = await contracts.TestStaking.instance.takeFullStake(
        tokenID,
        staker,
        recipient,
      )

      // check receipt for correct event logs
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        staker,
        amountStaked,
        0,
      ])

      // check the returned fullStake amount
      const returnVal = await contracts.TestStaking.instance.getFullStake()
      assert.equal(returnVal.toString(10), amountStaked)

      // check updated token balances, should be 10000 * 10**18
      const actualBalance = await this.MockNMR.balanceOf(recipient)
      assert.equal(actualBalance.toString(10), originalBalance)

      // now check the updated token balance of the staking contract
      const stakingBalance = await this.MockNMR.balanceOf(stakingAddress)
      assert.equal(stakingBalance.toString(10), 0)

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(
        tokenID,
        staker,
      )
      assert.equal(actualStake.toNumber(), 0)
    })
  })

  describe('Staking._burnStake', () => {
    const staker = wallets.seller.signer.signingKey.address
    const funder = wallets.numerai.signer.signingKey.address
    const tokenID = TOKEN_TYPES.NMR

    // it("should fail when currentStake is wrong", async () => {
    //   const amountBurnt = 10;
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // approve staking contract to transferFrom
    //   await this.MockNMR
    //     .from(funder)
    //     .approve(stakingAddress, amountBurnt);

    //   // add stake of 10 tokens
    //   await contracts.TestStaking.instance.addStake(
    //     staker,
    //     funder,
    //     amountBurnt
    //   );

    //   // should be 10
    //   await assert.revertWith(
    //     contracts.TestStaking.instance.burnStake(staker, 0, amountBurnt),
    //     "current stake incorrect"
    //   );
    // });

    // it("should fail when amountToBurn is 0", async () => {
    //   const amountStaked = 10;
    //   const stakingAddress = contracts.TestStaking.instance.contractAddress;

    //   // approve staking contract to transferFrom
    //   await this.MockNMR
    //     .from(funder)
    //     .approve(stakingAddress, amountStaked);

    //   // add stake of 10 tokens
    //   await contracts.TestStaking.instance.addStake(
    //     staker,
    //     funder,
    //     amountStaked
    //   );

    //   await assert.revertWith(
    //     contracts.TestStaking.instance.burnStake(staker, 0),
    //     "no stake to remove"
    //   );
    // });

    it('should fail when amountToBurn > currentStake', async () => {
      const amountStaked = 10
      const amountToBurn = 20
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      // approve staking contract to transferFrom
      await this.MockNMR.from(funder).approve(stakingAddress, amountStaked)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        funder,
        amountStaked,
      )

      // require amountToBurn <= amountStaked
      await assert.revertWith(
        contracts.TestStaking.instance.burnStake(tokenID, staker, amountToBurn),
        'insufficient deposit to remove',
      )
    })

    it('should burnStake successfully', async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      const amountToAdd = 10
      const amountBurn = 5

      // approve staking contract to transferFrom
      await this.MockNMR.from(funder).approve(stakingAddress, amountToAdd)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        funder,
        amountToAdd,
      )

      const txn = await contracts.TestStaking.instance.burnStake(
        tokenID,
        staker,
        amountBurn,
      )

      // check receipt for correct event logs
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        staker,
        amountBurn,
        amountToAdd - amountBurn,
      ])
      await assert.emitWithArgs(txn, 'StakeBurned', [
        tokenID,
        staker,
        amountBurn,
      ])

      // now check the updated token balance of the staking contract
      const stakingBalance = await this.MockNMR.balanceOf(stakingAddress)
      assert.equal(stakingBalance.toString(10), amountBurn)

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(
        tokenID,
        staker,
      )
      assert.equal(actualStake.toNumber(), amountBurn)
    })
  })

  describe('Staking._burnFullStake', () => {
    const staker = wallets.seller.signer.signingKey.address
    const funder = wallets.numerai.signer.signingKey.address
    const tokenID = TOKEN_TYPES.NMR

    it('should burnFullStake successfully', async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress

      const amountToAdd = 10

      // approve staking contract to transferFrom
      await this.MockNMR.from(funder).approve(stakingAddress, amountToAdd)

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        tokenID,
        staker,
        funder,
        amountToAdd,
      )

      const txn = await contracts.TestStaking.instance.burnFullStake(
        tokenID,
        staker,
      )

      let txReceipt = await txn.wait()
      let eventName = txReceipt.events[0].event
      let args = txReceipt.events[0].args
      console.log('eventName', eventName)
      console.log('args', args)
      console.log('receipt', txReceipt)

      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        staker,
        amountToAdd,
        0,
      ])

      // check receipt for correct event logs
      await assert.emitWithArgs(txn, 'DepositDecreased', [
        tokenID,
        staker,
        amountToAdd,
        0,
      ])
      await assert.emitWithArgs(txn, 'StakeBurned', [
        tokenID,
        staker,
        amountToAdd,
      ])

      // check the returned fullStake amount
      const returnVal = await contracts.TestStaking.instance.getFullStake()
      assert.equal(returnVal.toString(10), amountToAdd)

      // now check the updated token balance of the staking contract
      const stakingBalance = await this.MockNMR.balanceOf(stakingAddress)
      assert.equal(stakingBalance.toString(10), 0)

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(
        tokenID,
        staker,
      )
      assert.equal(actualStake.toNumber(), 0)
    })
  })
})
