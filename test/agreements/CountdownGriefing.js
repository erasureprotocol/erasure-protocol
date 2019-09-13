const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");

const CountdownGriefingArtifact = require("../../build/CountdownGriefing.json");
const TestCountdownGriefingArtifact = require("../../build/TestCountdownGriefing.json");
const MockNMRArtifact = require("../../build/MockNMR.json");

describe("CountdownGriefing", function() {
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
  const countdownLength = 1000;
  const staticMetadata = "TESTING";

  const initArgs = [
    operator,
    staker,
    counterparty,
    ratioE18,
    ratioType,
    countdownLength,
    Buffer.from(staticMetadata)
  ];

  // helper function to deploy TestCountdownGriefing
  const deployTestCountdownGriefing = async () => {
    // sets TestCountdownGriefing property to be used
    // by rest of the tests
    const contract = await deployer.deploy(
      TestCountdownGriefingArtifact,
      false,
      this.CountdownGriefing.contractAddress,
      this.MockNMR.contractAddress,
      ...initArgs
    );
    return contract;
  };

  let deployer;
  before(async () => {
    deployer = createDeployer();

    this.MockNMR = await deployer.deploy(MockNMRArtifact);
    this.CountdownGriefing = await deployer.deploy(
      CountdownGriefingArtifact,
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

  describe("CountdownGriefing.initialize", () => {
    it("should revert when caller is not contract", async () => {
      await assert.revertWith(
        this.CountdownGriefing.initialize(...initArgs),
        "must be called within contract constructor"
      );
    });

    it("should initialize contract", async () => {
      this.TestCountdownGriefing = await deployTestCountdownGriefing();

      // check that it's the TestCountdownGriefing state that is changed
      // not the CountdownGriefing logic contract's state
      const logicContractIsActive = await this.CountdownGriefing.hasActiveOperator();
      assert.equal(logicContractIsActive, false);

      // check all the state changes

      // Staking._setToken
      const token = await this.TestCountdownGriefing.getToken();
      assert.equal(token, this.MockNMR.contractAddress);

      // _data.staker
      const isStaker = await this.TestCountdownGriefing.isStaker(staker);
      assert.equal(isStaker, true);

      // _data.counterparty
      const isCounterparty = await this.TestCountdownGriefing.isCounterparty(
        counterparty
      );
      assert.equal(isCounterparty, true);

      // Operator._setOperator
      const operator = await this.TestCountdownGriefing.getOperator();
      assert.equal(operator, operator);

      //  Operator._activate()
      const callingContractIsActive = await this.TestCountdownGriefing.hasActiveOperator();
      assert.equal(callingContractIsActive, true);

      // Griefing._setRatio
      const [
        actualRatio,
        actualRatioType
      ] = await this.TestCountdownGriefing.getRatio(staker);
      assert.equal(actualRatio.toString(), ratioE18.toString());
      assert.equal(actualRatioType, ratioType);

      // Countdown._setLength
      const actualLength = await this.TestCountdownGriefing.getLength();
      assert.equal(actualLength, countdownLength);

      // Test for event logs
      // console.log(this.TestCountdownGriefing);
      // const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
      //   this.TestCountdownGriefing.deployTransaction
      // );
      // console.log(receipt.events);
    });

    it("should revert when not initialized from constructor", async () => {
      const initArgs = [
        this.CountdownGriefing.contractAddress,
        operator,
        staker,
        counterparty,
        ratioE18,
        ratioType,
        countdownLength,
        Buffer.from(staticMetadata)
      ];

      await assert.revertWith(
        this.TestCountdownGriefing.initializeCountdownGriefing(...initArgs),
        "must be called within contract constructor"
      );
    });
  });

  describe("CountdownGriefing.setMetadata", () => {
    const stakerMetadata = "STAKER";
    const operatorMetadata = "OPERATOR";

    it("should revert when msg.sender is not staker or active operator", async () => {
      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).setMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestCountdownGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).setMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );

      await this.TestCountdownGriefing.from(operator).activateOperator();
    });

    it("should set metadata when msg.sender is staker", async () => {
      const txn = await this.TestCountdownGriefing.from(
        staker
      ).setMetadata(Buffer.from(stakerMetadata));
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(stakerMetadata))
      );
    });

    it("should set metadata when msg.sender is operator", async () => {
      const txn = await this.TestCountdownGriefing.from(
        operator
      ).setMetadata(Buffer.from(operatorMetadata));
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(operatorMetadata))
      );
    });
  });

  describe("CountdownGriefing.startCountdown", () => {
    const startCountdown = async msgSender => {
      const txn = await this.TestCountdownGriefing.from(
        msgSender
      ).startCountdown();

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;
      const deadline = blockTimestamp + countdownLength;

      await assert.emit(txn, "DeadlineSet");
      await assert.emitWithArgs(txn, deadline);

      // get the stored delegatecall result
      const actualDeadline = await this.TestCountdownGriefing.getDeadline();
      assert.equal(actualDeadline.toNumber(), deadline);
    };

    it("should revert when msg.sender is not staker or active operator", async () => {
      // use the staker as the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).startCountdown(),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestCountdownGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).startCountdown(),
        "only staker or active operator"
      );

      await this.TestCountdownGriefing.from(operator).activateOperator();
    });

    it("should start countdown when msg.sender is staker", async () =>
      await startCountdown(staker));

    it("should revert when deadline already set", async () =>
      await assert.revertWith(
        startCountdown(operator),
        "deadline already set"
      ));

    it("should start countdown when msg.sender is operator", async () => {
      // it will throw when calling startCountdown again
      // re-deploy a new TestCountdownGriefing and initialize
      this.TestCountdownGriefing = await deployTestCountdownGriefing();

      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider);

      await startCountdown(operator);

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID);
    });
  });

  describe("CountdownGriefing.increaseStake", () => {
    let currentStake; // to increment as we go
    let amountToAdd = 500; // 500 token weis

    const increaseStake = async sender => {
      await this.MockNMR.from(sender).approve(
        this.TestCountdownGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestCountdownGriefing.from(sender).increaseStake(
        currentStake,
        amountToAdd
      );

      currentStake += amountToAdd;

      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
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
      currentStake = (await this.TestCountdownGriefing.getStake(
        staker
      )).toNumber();

      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).increaseStake(
          currentStake,
          amountToAdd
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestCountdownGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).increaseStake(
          currentStake,
          amountToAdd
        ),
        "only staker or active operator"
      );

      await this.TestCountdownGriefing.from(operator).activateOperator();
    });

    it("should increase stake when msg.sender is staker", async () => {
      await increaseStake(staker);
    });

    it("should increase stake when msg.sender is operator", async () => {
      await increaseStake(operator);
    });

    it("should revert when countdown over", async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider);

      await this.TestCountdownGriefing.startCountdown();

      // get current blockTimestamp so we can reset later
      const block = await deployer.provider.getBlock("latest");
      const oldTimestamp = block.timestamp;

      // set to 1000 seconds after the deadline
      const timePastDeadline = 1000;
      const newTimestamp = oldTimestamp + countdownLength + timePastDeadline;
      await utils.setTimeTo(deployer.provider, newTimestamp);

      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).increaseStake(
          currentStake,
          amountToAdd
        ),
        "agreement ended"
      );

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID);
    });
  });

  describe("CountdownGriefing.reward", () => {
    let currentStake; // to increment as we go
    let amountToAdd = 500; // 500 token weis

    const reward = async sender => {
      // update currentStake
      currentStake = (await this.TestCountdownGriefing.getStake(
        staker
      )).toNumber();

      await this.MockNMR.from(sender).approve(
        this.TestCountdownGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestCountdownGriefing.from(sender).reward(
        currentStake,
        amountToAdd
      );

      currentStake += amountToAdd;

      assert.equal(
        (await this.TestCountdownGriefing.getStake(staker)).toNumber(),
        currentStake
      );

      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
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
      currentStake = (await this.TestCountdownGriefing.getStake(
        staker
      )).toNumber();

      // use the staker to be the msg.sender
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).reward(
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestCountdownGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).reward(
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );

      await this.TestCountdownGriefing.from(operator).activateOperator();
    });

    it("should succeed when msg.sender is counterparty", async () => {
      await reward(counterparty);
    });

    it("should succeed when msg.sender is operator", async () => {
      await reward(operator);
    });

    it("should revert when countdown over", async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider);

      await this.TestCountdownGriefing.startCountdown();

      // get current blockTimestamp so we can reset later
      const block = await deployer.provider.getBlock("latest");
      const oldTimestamp = block.timestamp;

      // set to 1000 seconds after the deadline
      const timePastDeadline = 1000;
      const newTimestamp = oldTimestamp + countdownLength + timePastDeadline;
      await utils.setTimeTo(deployer.provider, newTimestamp);

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).reward(
          currentStake,
          amountToAdd
        ),
        "agreement ended"
      );

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID);
    });
  });

  describe("CountdownGriefing.punish", () => {
    const from = counterparty;
    const message = "I don't like you";
    let currentStake = ethers.utils.bigNumberify("0");

    const punishStaker = async () => {
      // increase staker's stake to 500
      await this.MockNMR.from(staker).changeApproval(
        this.TestCountdownGriefing.contractAddress,
        await this.MockNMR.allowance(
          staker,
          this.TestCountdownGriefing.contractAddress
        ),
        stakerStake
      );
      await this.TestCountdownGriefing.from(staker).increaseStake(
        currentStake,
        stakerStake
      );
      currentStake = currentStake.add(stakerStake);

      const expectedCost = punishment.mul(ratio);

      await this.MockNMR.from(counterparty).approve(
        this.TestCountdownGriefing.contractAddress,
        expectedCost
      );

      const txn = await this.TestCountdownGriefing.from(counterparty).punish(
        currentStake,
        punishment,
        Buffer.from(message)
      );
      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
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
      const griefCost = await this.TestCountdownGriefing.getGriefCost();
      assert.equal(griefCost.toString(), expectedCost.toString());
    };

    it("should revert when msg.sender is not counterparty or active operator", async () => {
      // update currentStake
      currentStake = await this.TestCountdownGriefing.getStake(staker);

      // staker is not counterparty or operator
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).punish(
          currentStake,
          punishment,
          Buffer.from(message)
        ),
        "only counterparty or active operator"
      );
    });

    it("should revert when agreement ended", async () => {
      // create snapshot
      let snapshotID = await utils.snapshot(deployer.provider);

      // required to start countdown

      await this.TestCountdownGriefing.from(staker).startCountdown();

      // move time forward to after the deadline

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      const exceedDeadlineBy = 1000;
      const futureTimestamp =
        blockTimestamp + countdownLength + exceedDeadlineBy;

      await utils.setTimeTo(deployer.provider, futureTimestamp);

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).punish(
          currentStake,
          punishment,
          Buffer.from(message)
        ),
        "agreement ended"
      );

      // return to snapshot
      await utils.revertState(deployer.provider, snapshotID);
    });

    it("should revert when no approval to burn tokens", async () => {
      currentStake = await this.TestCountdownGriefing.getStake(staker);

      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).punish(
          currentStake,
          punishment,
          Buffer.from(message)
        ),
        "nmr burnFrom failed"
      );
    });

    it("should revert when currentStake is incorrect", async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).punish(
          currentStake.add(1),
          punishment,
          Buffer.from(message)
        ),
        "current stake incorrect"
      );
    });

    it("should punish staker when startCountdown not called", async () =>
      await punishStaker());

    it("should punish staker when countdown not ended", async () => {
      await this.TestCountdownGriefing.startCountdown();
      await punishStaker();
    });
  });

  describe("CountdownGriefing.retrieveStake", () => {
    it("should revert when msg.sender is not staker or active operator", async () => {
      // redeploy contract since countdown is started
      this.TestCountdownGriefing = await deployTestCountdownGriefing();

      // counterparty is not staker or operator
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).retrieveStake(
          counterparty
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestCountdownGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).retrieveStake(counterparty),
        "only staker or active operator"
      );

      await this.TestCountdownGriefing.from(operator).activateOperator();
    });

    it("should revert when start countdown not called", async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).retrieveStake(staker),
        "deadline not passed"
      );
    });

    it("should revert when deadline not passed (when countdown is started)", async () => {
      await this.TestCountdownGriefing.from(staker).startCountdown();

      await assert.revertWith(
        this.TestCountdownGriefing.from(staker).retrieveStake(staker),
        "deadline not passed"
      );
    });

    it("should retrieve stake correctly", async () => {
      // redeploy contract since countdown is started
      this.TestCountdownGriefing = await deployTestCountdownGriefing();

      // staker increase stake

      await this.MockNMR.from(staker).approve(
        this.TestCountdownGriefing.contractAddress,
        stakerStake
      );

      await this.TestCountdownGriefing.from(staker).increaseStake(
        0,
        stakerStake
      );

      // required to start countdown

      await this.TestCountdownGriefing.from(staker).startCountdown();

      // move time forward to after the deadline

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      const exceedDeadlineBy = 1000;
      const futureTimestamp =
        blockTimestamp + countdownLength + exceedDeadlineBy;

      await utils.setTimeTo(deployer.provider, futureTimestamp);

      // retrieve stake after the deadline has passed

      const txn = await this.TestCountdownGriefing.from(staker).retrieveStake(
        staker
      );

      // check receipt for correct event logs
      const receipt = await this.TestCountdownGriefing.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeTaken";

      const stakeTakenEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeTakenEvent);
      assert.equal(stakeTakenEvent.args.staker, staker);
      assert.equal(stakeTakenEvent.args.recipient, staker);

      assert.equal(
        stakeTakenEvent.args.amount.toString(),
        stakerStake.toString()
      );
      assert.equal(stakeTakenEvent.args.newStake.toNumber(), 0);

      // get the stored delegatecall result
      const actualRetrieveAmount = await this.TestCountdownGriefing.getRetrieveStakeAmount();
      assert.equal(actualRetrieveAmount.toString(), stakerStake.toString());
    });
  });

  describe("CountdownGriefing.transferOperator", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).transferOperator(
          newOperator
        ),
        "only active operator"
      );
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestCountdownGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).transferOperator(
          newOperator
        ),
        "only active operator"
      );
      await this.TestCountdownGriefing.activateOperator();
    });

    it("should transfer operator", async () => {
      const txn = await this.TestCountdownGriefing.transferOperator(
        newOperator
      );
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [newOperator, true]);

      const actualOperator = await this.TestCountdownGriefing.getOperator();
      assert.equal(actualOperator, newOperator);

      const isActive = await this.TestCountdownGriefing.hasActiveOperator();
      assert.equal(isActive, true);
    });
  });

  describe("CountdownGriefing.renounceOperator", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestCountdownGriefing.from(counterparty).renounceOperator(),
        "only active operator"
      );
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestCountdownGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestCountdownGriefing.from(operator).renounceOperator(),
        "only active operator"
      );
      await this.TestCountdownGriefing.activateOperator();
    });

    it("should revert when msg.sender is not active operator", async () => {
      const txn = await this.TestCountdownGriefing.from(
        newOperator
      ).renounceOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, false]);

      const actualOperator = await this.TestCountdownGriefing.getOperator();
      assert.equal(actualOperator, ethers.constants.AddressZero);

      const isActive = await this.TestCountdownGriefing.hasActiveOperator();
      assert.equal(isActive, false);
    });
  });
});
