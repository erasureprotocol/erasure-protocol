const etherlime = require("etherlime-lib");

describe("Staking", function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    TestStaking: {
      artifact: require("../build/TestStaking.json")
    },
    MockNMR: {
      artifact: require("../build/MockNMR.json")
    }
  };

  let deployer;
  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(
      wallets.numerai.secretKey
    );
    contracts.TestStaking.instance = await deployer.deploy(
      contracts.TestStaking.artifact
    );
    contracts.MockNMR.instance = await deployer.deploy(
      contracts.MockNMR.artifact
    );

    const tokenAddress = contracts.MockNMR.instance.contractAddress;
    await contracts.TestStaking.instance.setToken(tokenAddress);
  });

  describe("Staking._setToken", () => {
    it("should setToken successfully", async () => {
      const tokenAddress = contracts.MockNMR.instance.contractAddress;
      const txn = await contracts.TestStaking.instance.setToken(tokenAddress);
      assert.emit(txn, "TokenSet");
      assert.emitWithArgs(txn, [tokenAddress]);

      const newToken = await contracts.TestStaking.instance.getToken();
      assert.equal(newToken, tokenAddress);
    });
  });

  describe("Staking._addStake", () => {
    // funder has funds to fund for the staker's stake
    const staker = wallets.seller.signer.signingKey.address;
    const funder = wallets.numerai.signer.signingKey.address;

    it("should fail when token is not set", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // reset back to initial token value
      await contracts.TestStaking.instance.setToken(
        ethers.constants.AddressZero
      );

      await contracts.MockNMR.instance.from(funder).approve(stakingAddress, 10);

      await assert.revertWith(
        contracts.TestStaking.instance.addStake(staker, funder, 0, 10),
        "token not set yet"
      );
    });

    it("should fail when currentStake is wrong", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // currentStake should begin from 0
      await assert.revertWith(
        contracts.TestStaking.instance.addStake(staker, funder, 10, 10),
        "current stake incorrect"
      );

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance.from(funder).approve(stakingAddress, 10);

      await contracts.TestStaking.instance.addStake(staker, funder, 0, 10);

      // // new currentStake should be 10 instead
      await assert.revertWith(
        contracts.TestStaking.instance.addStake(staker, funder, 0, 10),
        "current stake incorrect"
      );
    });

    it("should fail when amountToAdd is 0", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance.from(funder).approve(stakingAddress, 10);

      await assert.revertWith(
        contracts.TestStaking.instance.addStake(staker, funder, 0, 0),
        "no stake to add"
      );
    });

    it("should addStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountToAdd = 10;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountToAdd);

      // add stake of 10 tokens
      const txn = await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountToAdd
      );

      // check receipt for correct event logs
      const receipt = await contracts.TestStaking.instance.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeAdded";

      const stakeAddedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeAddedEvent);
      assert.equal(stakeAddedEvent.args.staker, staker);
      assert.equal(stakeAddedEvent.args.funder, funder);
      assert.equal(stakeAddedEvent.args.amount.toNumber(), amountToAdd);
      assert.equal(stakeAddedEvent.args.newStake.toNumber(), amountToAdd);

      // check updated token balances, 10000 * 10**18 - 10
      const originalBalance = ethers.utils.parseEther("10000");
      const expectedBalance = originalBalance.sub(amountToAdd).toString(10);
      const actualBalance = await contracts.MockNMR.instance.balanceOf(funder);
      assert.equal(actualBalance.toString(10), expectedBalance);

      // now check the updated token balance of the staking contract
      const stakingBalance = await contracts.MockNMR.instance.balanceOf(
        stakingAddress
      );
      assert.equal(stakingBalance.toString(10), amountToAdd);

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(staker);
      assert.equal(actualStake.toNumber(), amountToAdd);
    });
  });

  describe("Staking._takeStake", () => {
    const staker = wallets.seller.signer.signingKey.address;
    const recipient = wallets.numerai.signer.signingKey.address;

    it("should fail when token is not set", async () => {
      // reset back to initial token value
      await contracts.TestStaking.instance.setToken(
        ethers.constants.AddressZero
      );

      await assert.revertWith(
        contracts.TestStaking.instance.takeStake(staker, recipient, 0, 10),
        "token not set yet"
      );
    });

    it("should fail when currentStake is wrong", async () => {
      const amountStaked = 10;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(recipient)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        recipient,
        0,
        amountStaked
      );

      // should be 10
      await assert.revertWith(
        contracts.TestStaking.instance.takeStake(
          staker,
          recipient,
          0,
          amountStaked
        ),
        "current stake incorrect"
      );
    });

    it("should fail when amountToTake is 0", async () => {
      const amountStaked = 10;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(recipient)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        recipient,
        0,
        amountStaked
      );

      // should be 10
      await assert.revertWith(
        contracts.TestStaking.instance.takeStake(
          staker,
          recipient,
          amountStaked,
          0
        ),
        "no stake to take"
      );
    });

    it("should fail when amountToTake > currentStake", async () => {
      const amountStaked = 10;
      const amountToTake = 20;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(recipient)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        recipient,
        0,
        amountStaked
      );

      // amountToTake > amountStaked
      await assert.revertWith(
        contracts.TestStaking.instance.takeStake(
          staker,
          recipient,
          amountStaked,
          amountToTake
        ),
        "cannot take more than currentStake"
      );
    });

    it("should takeStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountToAdd = 10;
      const amountTaken = 5;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(recipient)
        .approve(stakingAddress, amountToAdd);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        recipient,
        0,
        amountToAdd
      );

      const txn = await contracts.TestStaking.instance.takeStake(
        staker,
        recipient,
        amountToAdd,
        amountTaken
      );

      // check receipt for correct event logs
      const receipt = await contracts.TestStaking.instance.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeTaken";

      const stakeTakenEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeTakenEvent);
      assert.equal(stakeTakenEvent.args.staker, staker);
      assert.equal(stakeTakenEvent.args.recipient, recipient);
      assert.equal(stakeTakenEvent.args.amount.toNumber(), amountTaken);
      assert.equal(stakeTakenEvent.args.newStake.toNumber(), amountTaken);

      // check updated token balances, 10000 * 10**18 - 10
      const originalBalance = ethers.utils.parseEther("10000");
      const expectedBalance = originalBalance.sub(amountTaken).toString(10);
      const actualBalance = await contracts.MockNMR.instance.balanceOf(
        recipient
      );
      assert.equal(actualBalance.toString(10), expectedBalance);

      // now check the updated token balance of the staking contract
      const stakingBalance = await contracts.MockNMR.instance.balanceOf(
        stakingAddress
      );
      assert.equal(stakingBalance.toString(10), amountTaken);

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(staker);
      assert.equal(actualStake.toNumber(), amountTaken);
    });
  });

  describe("Staking._takeFullStake", () => {
    // funder has funds to fund for the staker's stake
    const staker = wallets.seller.signer.signingKey.address;
    const recipient = wallets.numerai.signer.signingKey.address;

    it("should takeFullStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountStaked = 10;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(recipient)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        recipient,
        0,
        amountStaked
      );

      const txn = await contracts.TestStaking.instance.takeFullStake(
        staker,
        recipient
      );

      // check receipt for correct event logs
      const receipt = await contracts.TestStaking.instance.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeTaken";

      const stakeTakenEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeTakenEvent);
      assert.equal(stakeTakenEvent.args.staker, staker);
      assert.equal(stakeTakenEvent.args.recipient, recipient);
      assert.equal(stakeTakenEvent.args.amount.toNumber(), amountStaked);
      assert.equal(stakeTakenEvent.args.newStake.toNumber(), 0);

      // check the returned fullStake amount
      const returnVal = await contracts.TestStaking.instance.getFullStake();
      assert.equal(returnVal.toString(10), amountStaked);

      // check updated token balances, should be 10000 * 10**18
      const expectedBalance = ethers.utils.parseEther("10000");
      const actualBalance = await contracts.MockNMR.instance.balanceOf(
        recipient
      );
      assert.equal(actualBalance.toString(10), expectedBalance);

      // now check the updated token balance of the staking contract
      const stakingBalance = await contracts.MockNMR.instance.balanceOf(
        stakingAddress
      );
      assert.equal(stakingBalance.toString(10), 0);

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(staker);
      assert.equal(actualStake.toNumber(), 0);
    });
  });

  describe("Staking._burnStake", () => {
    const staker = wallets.seller.signer.signingKey.address;
    const funder = wallets.numerai.signer.signingKey.address;

    it("should fail when token is not set", async () => {
      // reset back to initial token value
      await contracts.TestStaking.instance.setToken(
        ethers.constants.AddressZero
      );

      await assert.revertWith(
        contracts.TestStaking.instance.burnStake(staker, 0, 10),
        "token not set yet"
      );
    });

    it("should fail when currentStake is wrong", async () => {
      const amountBurnt = 10;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountBurnt);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountBurnt
      );

      // should be 10
      await assert.revertWith(
        contracts.TestStaking.instance.burnStake(staker, 0, amountBurnt),
        "current stake incorrect"
      );
    });

    it("should fail when amountToBurn is 0", async () => {
      const amountStaked = 10;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountStaked
      );

      await assert.revertWith(
        contracts.TestStaking.instance.burnStake(staker, amountStaked, 0),
        "no stake to burn"
      );
    });

    it("should fail when amountToBurn > currentStake", async () => {
      const amountStaked = 10;
      const amountToBurn = 20;
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountStaked);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountStaked
      );

      // require amountToBurn <= amountStaked
      await assert.revertWith(
        contracts.TestStaking.instance.burnStake(
          staker,
          amountStaked,
          amountToBurn
        ),
        "cannot burn more than currentStake"
      );
    });

    it("should burnStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountToAdd = 10;
      const amountBurn = 5;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountToAdd);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountToAdd
      );

      const txn = await contracts.TestStaking.instance.burnStake(
        staker,
        amountToAdd,
        amountBurn
      );

      // check receipt for correct event logs
      const receipt = await contracts.TestStaking.instance.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeBurned";

      const stakeBurnedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeBurnedEvent);
      assert.equal(stakeBurnedEvent.args.staker, staker);
      assert.equal(stakeBurnedEvent.args.amount.toNumber(), amountBurn);
      assert.equal(stakeBurnedEvent.args.newStake.toNumber(), amountBurn);

      // now check the updated token balance of the staking contract
      const stakingBalance = await contracts.MockNMR.instance.balanceOf(
        stakingAddress
      );
      assert.equal(stakingBalance.toString(10), amountBurn);

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(staker);
      assert.equal(actualStake.toNumber(), amountBurn);
    });
  });

  describe("Staking._burnFullStake", () => {
    const staker = wallets.seller.signer.signingKey.address;
    const funder = wallets.numerai.signer.signingKey.address;

    it("should burnFullStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountToAdd = 10;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance
        .from(funder)
        .approve(stakingAddress, amountToAdd);

      // add stake of 10 tokens
      await contracts.TestStaking.instance.addStake(
        staker,
        funder,
        0,
        amountToAdd
      );

      const txn = await contracts.TestStaking.instance.burnFullStake(staker);

      // check receipt for correct event logs
      const receipt = await contracts.TestStaking.instance.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeBurned";

      const stakeBurnedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeBurnedEvent);
      assert.equal(stakeBurnedEvent.args.staker, staker);
      assert.equal(stakeBurnedEvent.args.amount.toNumber(), amountToAdd);
      assert.equal(stakeBurnedEvent.args.newStake.toNumber(), 0);

      // check the returned fullStake amount
      const returnVal = await contracts.TestStaking.instance.getFullStake();
      assert.equal(returnVal.toString(10), amountToAdd);

      // now check the updated token balance of the staking contract
      const stakingBalance = await contracts.MockNMR.instance.balanceOf(
        stakingAddress
      );
      assert.equal(stakingBalance.toString(10), 0);

      // check correct stake in staking contract mapping
      const actualStake = await contracts.TestStaking.instance.getStake(staker);
      assert.equal(actualStake.toNumber(), 0);
    });
  });
});
