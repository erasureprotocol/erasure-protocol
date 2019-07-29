const etherlime = require("etherlime-lib");
const BigNumber = require("bignumber.js");

describe("Staking", () => {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    Staking: {
      artifact: require("../build/Staking.json")
    },
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
    contracts.Staking.instance = await deployer.deploy(
      contracts.Staking.artifact
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
      await contracts.TestStaking.instance.setToken(tokenAddress);
    });
  });

  describe("Staking._addStake", () => {
    // funder has funds to fund for the staker's stake
    const staker = wallets.seller.signer.signingKey.address;
    const funder = wallets.numerai.signer.signingKey.address;

    it("should fail when currentStake is wrong", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // currentStake should begin from 0
      await assert.revert(
        contracts.TestStaking.instance.addStake(staker, funder, 10, 10)
      );

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance.approve(stakingAddress, 10);

      await contracts.TestStaking.instance.addStake(staker, funder, 0, 10);

      // // new currentStake should be 10 instead
      await assert.revert(
        contracts.TestStaking.instance.addStake(staker, funder, 0, 10)
      );
    });

    it("should fail when amountToAdd is 0", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance.approve(stakingAddress, 10);

      await assert.revert(
        contracts.TestStaking.instance.addStake(staker, funder, 0, 0)
      );
    });

    it("should addStake successfully", async () => {
      const stakingAddress = contracts.TestStaking.instance.contractAddress;

      const amountToAdd = 10;

      // approve staking contract to transferFrom
      await contracts.MockNMR.instance.approve(stakingAddress, amountToAdd);

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
      const expectedBalance = "9999999999999999999990";
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
});
