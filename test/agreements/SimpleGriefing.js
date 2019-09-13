const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");

const SimpleGriefingArtifact = require("../../build/SimpleGriefing.json");
const TestSimpleGriefingArtifact = require("../../build/TestSimpleGriefing.json");
const MockNMRArtifact = require("../../build/MockNMR.json");

describe("SimpleGriefing", function() {
  this.timeout(4000);

  // wallets and addresses
  const [
    operatorWallet,
    counterpartyWallet,
    stakerWallet,
    newOperatorWallet
  ] = accounts;
  const operator = operatorWallet.signer.signingKey.address;
  const counterparty = counterpartyWallet.signer.signingKey.address;
  const staker = stakerWallet.signer.signingKey.address;
  const newOperator = newOperatorWallet.signer.signingKey.address;

  // variables used in initialize()
  const stakerStake = ethers.utils.parseEther("200");
  const punishment = ethers.utils.parseEther("100");
  const ratio = 2;
  const ratioE18 = ethers.utils.parseEther(ratio.toString());
  const ratioType = RATIO_TYPES.Dec;
  const staticMetadata = "TESTING";
  let currentStake; // to increment as we go

  const initArgs = [
    operator,
    staker,
    counterparty,
    ratioE18,
    ratioType,
    Buffer.from(staticMetadata)
  ];

  // helper function to deploy TestSimpleGriefing
  const deployTestSimpleGriefing = async () => {
    // sets TestSimpleGriefing property to be used
    // by rest of the tests
    const contract = await deployer.deploy(
      TestSimpleGriefingArtifact,
      false,
      this.SimpleGriefing.contractAddress,
      this.MockNMR.contractAddress,
      ...initArgs
    );
    return contract;
  };

  let deployer;
  before(async () => {
    deployer = createDeployer();

    this.MockNMR = await deployer.deploy(MockNMRArtifact);
    this.SimpleGriefing = await deployer.deploy(
      SimpleGriefingArtifact,
      false,
      this.MockNMR.contractAddress
    );

    // fill the token balances of the counterparty and staker
    // counterparty & staker has 1,000 * 10^18 each
    const startingBalance = "1000";
    await this.MockNMR.from(operator).transfer(
      counterparty,
      ethers.utils.parseEther(startingBalance)
    );
    await this.MockNMR.from(operator).transfer(
      staker,
      ethers.utils.parseEther(startingBalance)
    );
  });

  describe("SimpleGriefing.initialize", () => {
    it("should revert when caller is not contract", async () => {
      await assert.revertWith(
        this.SimpleGriefing.initialize(...initArgs),
        "must be called within contract constructor"
      );
    });

    it("should initialize contract", async () => {
      this.TestSimpleGriefing = await deployTestSimpleGriefing();

      // check that SimpleGriefing do not have Countdown contract attributes
      // getLength should not be present in SimpleGriefing
      assert.strictEqual(this.SimpleGriefing.getLength, undefined);
      assert.strictEqual(this.SimpleGriefing.startCountdown, undefined);

      // check that it's the TestSimpleGriefing state that is changed
      // not the SimpleGriefing logic contract's state
      const logicContractIsActive = await this.SimpleGriefing.hasActiveOperator();
      assert.equal(logicContractIsActive, false);

      // check all the state changes

      // Staking._setToken
      const token = await this.TestSimpleGriefing.getToken();
      assert.equal(token, this.MockNMR.contractAddress);

      // _data.staker
      const isStaker = await this.TestSimpleGriefing.isStaker(staker);
      assert.equal(isStaker, true);

      // _data.counterparty
      const isCounterparty = await this.TestSimpleGriefing.isCounterparty(
        counterparty
      );
      assert.equal(isCounterparty, true);

      // Operator._setOperator
      const operator = await this.TestSimpleGriefing.getOperator();
      assert.equal(operator, operator);

      //  Operator._activate()
      const callingContractIsActive = await this.TestSimpleGriefing.hasActiveOperator();
      assert.equal(callingContractIsActive, true);

      // Griefing._setRatio
      const [
        actualRatio,
        actualRatioType
      ] = await this.TestSimpleGriefing.getRatio(staker);
      assert.equal(actualRatio.toString(), ratioE18.toString());
      assert.equal(actualRatioType, ratioType);

      // Test for event logs
      // console.log(this.TestSimpleGriefing);
      // const receipt = await this.TestSimpleGriefing.verboseWaitForTransaction(
      //   this.TestSimpleGriefing.deployTransaction
      // );
      // console.log(receipt.events);
    });

    it("should revert when not initialized from constructor", async () => {
      const initArgs = [
        this.SimpleGriefing.contractAddress,
        operator,
        staker,
        counterparty,
        ratioE18,
        ratioType,
        Buffer.from(staticMetadata)
      ];

      await assert.revertWith(
        this.TestSimpleGriefing.initializeSimpleGriefing(...initArgs),
        "must be called within contract constructor"
      );
    });
  });

  describe("SimpleGriefing.setMetadata", () => {
    const stakerMetadata = "STAKER";
    const operatorMetadata = "OPERATOR";

    it("should revert when msg.sender is not staker or active operator", async () => {
      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).setMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestSimpleGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).setMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should set metadata when msg.sender is staker", async () => {
      const txn = await this.TestSimpleGriefing.from(
        staker
      ).setMetadata(Buffer.from(stakerMetadata));
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(stakerMetadata))
      );
    });

    it("should set metadata when msg.sender is operator", async () => {
      const txn = await this.TestSimpleGriefing.from(
        operator
      ).setMetadata(Buffer.from(operatorMetadata));
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(operatorMetadata))
      );
    });
  });

  describe("SimpleGriefing.increaseStake", () => {
    let amountToAdd = 500; // 500 token weis

    const increaseStake = async sender => {
      await this.MockNMR.from(sender).approve(
        this.TestSimpleGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestSimpleGriefing.from(sender).increaseStake(
        currentStake,
        amountToAdd
      );

      currentStake += amountToAdd;

      const receipt = await this.TestSimpleGriefing.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeAdded";

      const stakeAddedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeAddedEvent);
      assert.equal(stakeAddedEvent.args.staker, staker);
      assert.equal(stakeAddedEvent.args.funder, sender);
      assert.equal(stakeAddedEvent.args.amount.toNumber(), amountToAdd);
      assert.equal(stakeAddedEvent.args.newStake.toNumber(), currentStake);
    };

    it("should revert when msg.sender is counterparty", async () => {
      // update currentStake
      currentStake = (await this.TestSimpleGriefing.getStake(
        staker
      )).toNumber();

      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).increaseStake(
          currentStake,
          amountToAdd
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestSimpleGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).increaseStake(
          currentStake,
          amountToAdd,
          { gasLimit: 30000 }
        ),
        "only staker or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should increase stake when msg.sender is staker", async () => {
      await increaseStake(staker);
    });

    it("should increase stake when msg.sender is operator", async () => {
      await increaseStake(operator);
    });
  });

  describe("SimpleGriefing.reward", () => {
    let currentStake; // to increment as we go
    let amountToAdd = 500; // 500 token weis

    const reward = async sender => {
      // update currentStake
      currentStake = (await this.TestSimpleGriefing.getStake(
        staker
      )).toNumber();

      await this.MockNMR.from(sender).approve(
        this.TestSimpleGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestSimpleGriefing.from(sender).reward(
        currentStake,
        amountToAdd
      );

      currentStake += amountToAdd;

      assert.equal(
        (await this.TestSimpleGriefing.getStake(staker)).toNumber(),
        currentStake
      );

      const receipt = await this.TestSimpleGriefing.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeAdded";

      const stakeAddedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeAddedEvent);
      assert.equal(stakeAddedEvent.args.staker, staker);
      assert.equal(stakeAddedEvent.args.funder, sender);
      assert.equal(stakeAddedEvent.args.amount.toNumber(), amountToAdd);
      assert.equal(stakeAddedEvent.args.newStake.toNumber(), currentStake);
    };

    it("should revert when msg.sender is staker", async () => {
      // update currentStake
      currentStake = (await this.TestSimpleGriefing.getStake(
        staker
      )).toNumber();

      // use the staker to be the msg.sender
      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).reward(currentStake, amountToAdd),
        "only counterparty or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestSimpleGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).reward(
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should succeed when msg.sender is counterparty", async () => {
      await reward(counterparty);
    });

    it("should succeed when msg.sender is operator", async () => {
      await reward(operator);
    });
  });

  describe("SimpleGriefing.punish", () => {
    const from = counterparty;
    const message = "I don't like you";
    const punishArgs = [from, punishment, Buffer.from(message)];
    currentStake = ethers.utils.bigNumberify("0");

    const punishStaker = async () => {
      // increase staker's stake to 500
      await this.MockNMR.from(staker).approve(
        this.TestSimpleGriefing.contractAddress,
        stakerStake
      );
      await this.TestSimpleGriefing.from(staker).increaseStake(
        currentStake,
        stakerStake
      );
      currentStake = currentStake.add(stakerStake);

      const expectedCost = punishment.mul(ratio);

      await this.MockNMR.from(counterparty).approve(
        this.TestSimpleGriefing.contractAddress,
        expectedCost
      );

      const txn = await this.TestSimpleGriefing.from(counterparty).punish(
        currentStake,
        punishment,
        Buffer.from(message)
      );
      const receipt = await this.TestSimpleGriefing.verboseWaitForTransaction(
        txn
      );

      // deducting current stake to be used in subsequent increaseStake call
      currentStake = currentStake.sub(punishment);

      const expectedEvent = "Griefed";

      const griefedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(griefedEvent);
      assert.equal(griefedEvent.args.punisher, counterparty);
      assert.equal(griefedEvent.args.staker, staker);
      assert.equal(
        griefedEvent.args.punishment.toString(),
        punishment.toString()
      );
      assert.equal(griefedEvent.args.cost.toString(), expectedCost.toString());
      assert.equal(
        griefedEvent.args.message,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))
      );

      // get the stored delegatecall result
      const griefCost = await this.TestSimpleGriefing.getGriefCost();
      assert.equal(griefCost.toString(), expectedCost.toString());
    };

    it("should revert when msg.sender is not counterparty or active operator", async () => {
      // update currentStake
      currentStake = await this.TestSimpleGriefing.getStake(staker);

      // staker is not counterparty or operator
      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).punish(
          currentStake,
          punishment,
          Buffer.from(message)
        ),
        "only counterparty or active operator"
      );
    });

    it("should revert when no approval to burn tokens", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).punish(
          currentStake,
          punishment,
          Buffer.from(message)
        ),
        "nmr burnFrom failed"
      );
    });

    it("should punish staker", async () => await punishStaker());
  });

  describe("SimpleGriefing.releaseStake", () => {
    let currentStake;
    const releaseAmount = ethers.utils.parseEther("100");

    const releaseStake = async (sender, staker, releaseAmount) => {
      const currentStake = await this.TestSimpleGriefing.getStake(staker);

      const txn = await this.TestSimpleGriefing.from(sender).releaseStake(
        currentStake,
        releaseAmount
      );
      const receipt = await this.TestSimpleGriefing.verboseWaitForTransaction(
        txn
      );
      const eventLogs = utils.parseLogs(
        receipt,
        this.TestSimpleGriefing,
        "StakeTaken"
      );
      assert.equal(eventLogs.length, 1);
      const [event] = eventLogs;
      assert.equal(event.staker, staker);
      assert.equal(event.recipient, staker); // staker's stake is released to staker address
      assert.equal(event.amount.toString(), releaseAmount.toString()); // amount released is the full stake amount
      assert.equal(
        event.newStake.toString(),
        currentStake.sub(releaseAmount).toString()
      );
    };

    it("should revert when msg.sender is not counterparty or active operator", async () => {
      currentStake = await this.TestSimpleGriefing.getStake(staker);

      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).releaseStake(
          currentStake,
          releaseAmount
        ),
        "only counterparty or active operator"
      );
    });

    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestSimpleGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).releaseStake(
          currentStake,
          releaseAmount
        ),
        "only counterparty or active operator"
      );
      await this.TestSimpleGriefing.activateOperator();
    });

    it("should release stake when msg.sender is counterparty", async () =>
      await releaseStake(counterparty, staker, releaseAmount));

    it("should release full stake", async () => {
      const currentStake = await this.TestSimpleGriefing.getStake(staker);
      await releaseStake(counterparty, staker, currentStake);
    });

    it("should release stake when msg.sender is active operator", async () => {
      // have to re-increase stake to release
      await this.MockNMR.from(staker).approve(
        this.TestSimpleGriefing.contractAddress,
        stakerStake
      );

      const currentStake = await this.TestSimpleGriefing.getStake(staker);

      await this.TestSimpleGriefing.from(staker).increaseStake(
        currentStake,
        stakerStake
      );

      await releaseStake(operator, staker, releaseAmount);
    });
  });

  describe("SimpleGriefing.transferOperator", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).transferOperator(
          newOperator
        ),
        "only active operator"
      );
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestSimpleGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).transferOperator(
          newOperator
        ),
        "only active operator"
      );
      await this.TestSimpleGriefing.activateOperator();
    });

    it("should transfer operator", async () => {
      const txn = await this.TestSimpleGriefing.transferOperator(newOperator);
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [newOperator, true]);

      const actualOperator = await this.TestSimpleGriefing.getOperator();
      assert.equal(actualOperator, newOperator);

      const isActive = await this.TestSimpleGriefing.hasActiveOperator();
      assert.equal(isActive, true);
    });
  });

  describe("SimpleGriefing.renounceOperator", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).renounceOperator(),
        "only active operator"
      );
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestSimpleGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).renounceOperator(),
        "only active operator"
      );
      await this.TestSimpleGriefing.activateOperator();
    });

    it("should revert when msg.sender is not active operator", async () => {
      const txn = await this.TestSimpleGriefing.from(
        newOperator
      ).renounceOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, false]);

      const actualOperator = await this.TestSimpleGriefing.getOperator();
      assert.equal(actualOperator, ethers.constants.AddressZero);

      const isActive = await this.TestSimpleGriefing.hasActiveOperator();
      assert.equal(isActive, false);
    });
  });
});
