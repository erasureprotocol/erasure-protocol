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
    newOperatorWallet,
    otherWallet
  ] = accounts;
  const operator = operatorWallet.signer.signingKey.address;
  const counterparty = counterpartyWallet.signer.signingKey.address;
  const staker = stakerWallet.signer.signingKey.address;
  const newOperator = newOperatorWallet.signer.signingKey.address;
  const otherUser = otherWallet.signer.signingKey.address;

  // variables used in initialize()
  const stakerStake = ethers.utils.parseEther("200");
  const punishment = ethers.utils.parseEther("100");
  const ratio = 2;
  const ratioE18 = ethers.utils.parseEther(ratio.toString());
  const ratioType = RATIO_TYPES.Dec;
  const staticMetadata = "TESTING";
  let currentStake; // to increment as we go

  const abiEncoder = new ethers.utils.AbiCoder();

  const stakeDataA = abiEncoder.encode(
    ["uint256", "uint8"],
    [ratioE18, ratioType]
  );
  const stakeDataB = abiEncoder.encode(
    ["uint256", "uint8"],
    [ratioE18, ratioType]
  );

  const initArgs = [
    operator,
    staker,
    counterparty,
    stakeDataA,
    stakeDataB,
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

    this.SimpleGriefing = await deployer.deploy(SimpleGriefingArtifact);
    this.MockNMR = await deployer.deploy(MockNMRArtifact);

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
        this.SimpleGriefing.initialize(
          this.MockNMR.contractAddress,
          ...initArgs
        ),
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

      // _data.staker
      const isCounterparty = await this.TestSimpleGriefing.isStaker(
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

      // Metadata._setStaticMetadata
      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestSimpleGriefing.getMetadata();
      assert.equal(
        actualStaticMetadata,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(staticMetadata))
      );
      assert.equal(actualVariableMetadata, "0x");

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
        this.MockNMR.contractAddress,
        operator,
        staker,
        counterparty,
        stakeDataA,
        stakeDataB,
        Buffer.from(staticMetadata)
      ];

      await assert.revertWith(
        this.TestSimpleGriefing.initializeSimpleGriefing(...initArgs),
        "must be called within contract constructor"
      );
    });
  });

  describe("SimpleGriefing.setVariableMetadata", () => {
    const stakerMetadata = "STAKER";
    const operatorMetadata = "OPERATOR";

    it("should revert when msg.sender is not staker or active operator", async () => {
      // use the counterparty to be the msg.sender
      await assert.revertWith(
        this.TestSimpleGriefing.from(otherUser).setVariableMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestSimpleGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).setVariableMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should set variable metadata when msg.sender is staker", async () => {
      const txn = await this.TestSimpleGriefing.from(
        staker
      ).setVariableMetadata(Buffer.from(stakerMetadata));
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(stakerMetadata))
      );
    });

    it("should set variable metadata when msg.sender is operator", async () => {
      const txn = await this.TestSimpleGriefing.from(
        operator
      ).setVariableMetadata(Buffer.from(operatorMetadata));
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(operatorMetadata))
      );
    });
  });

  describe("SimpleGriefing.increaseStake", () => {
    let amountToAdd = 500; // 500 token weis

    const increaseStake = async (sender, staker) => {
      currentStake = (await this.TestSimpleGriefing.getStake(
        staker
      )).toNumber();

      await this.MockNMR.from(sender).approve(
        this.TestSimpleGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestSimpleGriefing.from(sender).increaseStake(
        staker,
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
          staker,
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
          staker,
          currentStake,
          amountToAdd,
          { gasLimit: 30000 }
        ),
        "only staker or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should revert when counterparty increase stake for staker", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).increaseStake(
          staker,
          currentStake,
          amountToAdd,
          { gasLimit: 30000 }
        ),
        "only staker or active operator"
      );
    });

    it("should revert when staker increase stake for counterparty", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).increaseStake(
          counterparty,
          currentStake,
          amountToAdd,
          { gasLimit: 30000 }
        ),
        "only staker or active operator"
      );
    });

    it("should increase stake when msg.sender is staker", async () => {
      await increaseStake(staker, staker);
      await increaseStake(counterparty, counterparty);
    });

    it("should increase stake when msg.sender is operator", async () => {
      await increaseStake(operator, staker);
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
        staker,
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

    it("should revert when msg.sender is not staker or operator", async () => {
      // update currentStake
      currentStake = (await this.TestSimpleGriefing.getStake(
        staker
      )).toNumber();

      // use a random user to be the msg.sender
      await assert.revertWith(
        this.TestSimpleGriefing.from(otherUser).reward(
          staker,
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );
    });

    it("should revert when msg.sender is deactivated operator", async () => {
      await this.TestSimpleGriefing.from(operator).deactivateOperator();

      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).reward(
          staker,
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );

      await this.TestSimpleGriefing.from(operator).activateOperator();
    });

    it("should revert when staker reward self", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).reward(
          staker,
          currentStake,
          amountToAdd
        ),
        "only counterparty or active operator"
      );
    });

    it("should succeed when msg.sender is counterparty", async () => {
      await reward(counterparty);
    });

    it("should succeed when msg.sender is operator", async () => {
      await reward(operator);
    });
  });

  describe("SimpleGriefing.punish", () => {
    const target = staker;
    const message = "I don't like you";
    const punishArgs = [target, punishment, Buffer.from(message)];

    const punishStaker = async (staker, counterparty) => {
      currentStake = await this.TestSimpleGriefing.getStake(staker);

      // increase staker's stake to 500
      await this.MockNMR.from(staker).approve(
        this.TestSimpleGriefing.contractAddress,
        stakerStake
      );
      await this.TestSimpleGriefing.from(staker).increaseStake(
        staker,
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
        ...punishArgs
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
        this.TestSimpleGriefing.from(staker).punish(...punishArgs),
        "only counterparty or active operator"
      );
    });

    it("should revert when no approval to burn tokens", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(counterparty).punish(...punishArgs),
        "insufficient allowance"
      );
    });

    it("should punish staker", async () =>
      await punishStaker(staker, counterparty));
  });

  describe("SimpleGriefing.releaseStake", () => {
    const releaseStake = async (sender, staker) => {
      const txn = await this.TestSimpleGriefing.from(sender).releaseStake(
        staker
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
      assert.equal(event.amount.toString(), currentStake.toString()); // amount released is the full stake amount
      assert.equal(event.newStake.toNumber(), 0);

      const releaseStakeAmount = await this.TestSimpleGriefing.getReleaseStakeAmount();
      assert.equal(releaseStakeAmount.toString(), currentStake.toString());
    };

    it("should revert when msg.sender is not counterparty or active operator", async () => {
      await assert.revertWith(
        this.TestSimpleGriefing.from(staker).releaseStake(staker),
        "only counterparty or active operator"
      );
    });

    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestSimpleGriefing.deactivateOperator();
      await assert.revertWith(
        this.TestSimpleGriefing.from(operator).releaseStake(staker),
        "only counterparty or active operator"
      );
      await this.TestSimpleGriefing.activateOperator();
    });

    it("should release stake when msg.sender is counterparty", async () =>
      await releaseStake(counterparty, staker));

    it("should release stake when msg.sender is active operator", async () => {
      currentStake = stakerStake;

      // have to re-increase stake to release
      await this.MockNMR.from(staker).approve(
        this.TestSimpleGriefing.contractAddress,
        currentStake
      );
      await this.TestSimpleGriefing.from(staker).increaseStake(
        staker,
        0,
        stakerStake
      );

      await releaseStake(operator, staker);
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
