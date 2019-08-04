const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");

const OneWayGriefingArtifact = require("../../build/OneWayGriefing.json");
const TestOneWayGriefingArtifact = require("../../build/TestOneWayGriefing.json");
const MockNMRArtifact = require("../../build/MockNMR.json");

describe("OneWayGriefing", function() {
  this.timeout(4000);

  // wallets and addresses
  const [ownerWallet, buyerWallet, sellerWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const buyer = buyerWallet.signer.signingKey.address;
  const seller = sellerWallet.signer.signingKey.address;

  // variables used in initialize()
  const ratio = 2;
  const ratioType = RATIO_TYPES.CgtP;
  const countdownLength = 1000;
  const staticMetadata = "TESTING";

  const initArgs = [
    owner,
    seller,
    buyer,
    ratio,
    ratioType,
    countdownLength,
    Buffer.from(staticMetadata)
  ];

  // helper function to deploy TestOneWayGriefing
  const deployTestOneWayGriefing = async () => {
    // sets TestOneWayGriefing property to be used
    // by rest of the tests
    const contract = await deployer.deploy(
      TestOneWayGriefingArtifact,
      false,
      this.OneWayGriefing.contractAddress,
      this.MockNMR.contractAddress,
      ...initArgs
    );
    return contract;
  };

  let deployer;
  before(async () => {
    deployer = createDeployer();

    this.OneWayGriefing = await deployer.deploy(OneWayGriefingArtifact);
    this.MockNMR = await deployer.deploy(MockNMRArtifact);

    // fill the token balances of the buyer and seller
    // buyer & seller has 1,000 tokens (in wei) each
    const startingBalance = "1000";
    await this.MockNMR.from(owner).transfer(
      buyer,
      ethers.utils.parseEther(startingBalance)
    );
    await this.MockNMR.from(owner).transfer(
      seller,
      ethers.utils.parseEther(startingBalance)
    );
  });

  describe("OneWayGriefing.initialize", () => {
    it("should revert when caller is not contract", async () => {
      await assert.revertWith(
        this.OneWayGriefing.initialize(
          this.MockNMR.contractAddress,
          ...initArgs
        ),
        "must be called within contract constructor"
      );
    });

    it("should initialize contract", async () => {
      this.TestOneWayGriefing = await deployTestOneWayGriefing();

      // check that it's the TestOneWayGriefing state that is changed
      // not the OneWayGriefing logic contract's state
      const logicContractIsActive = await this.OneWayGriefing.isActive();
      assert.equal(logicContractIsActive, false);

      // check all the state changes

      // Staking._setToken
      const token = await this.TestOneWayGriefing.getToken();
      assert.equal(token, this.MockNMR.contractAddress);

      // _data.staker
      const isStaker = await this.TestOneWayGriefing.isStaker(seller);
      assert.equal(isStaker, true);

      // _data.counterparty
      const isCounterparty = await this.TestOneWayGriefing.isCounterparty(
        buyer
      );
      assert.equal(isCounterparty, true);

      // Operator._setOperator
      const operator = await this.TestOneWayGriefing.getOperator();
      assert.equal(operator, owner);

      //  Operator._activate()
      const callingContractIsActive = await this.TestOneWayGriefing.isActive();
      assert.equal(callingContractIsActive, true);

      // Griefing._setRatio
      const [
        actualRatio,
        actualRatioType
      ] = await this.TestOneWayGriefing.getRatio(seller);
      assert.equal(actualRatio, ratio);
      assert.equal(actualRatioType, ratioType);

      // Countdown._setLength
      const actualLength = await this.TestOneWayGriefing.getLength();
      assert.equal(actualLength, countdownLength);

      // Metadata._setStaticMetadata
      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestOneWayGriefing.getMetadata();
      assert.equal(
        actualStaticMetadata,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(staticMetadata))
      );
      assert.equal(actualVariableMetadata, "0x");

      // Test for event logs
      // console.log(this.TestOneWayGriefing);
      // const receipt = await this.TestOneWayGriefing.verboseWaitForTransaction(
      //   this.TestOneWayGriefing.deployTransaction
      // );
      // console.log(receipt.events);
    });

    it("should revert when not initialized from constructor", async () => {
      const initArgs = [
        this.OneWayGriefing.contractAddress,
        this.MockNMR.contractAddress,
        owner,
        seller,
        buyer,
        ratio,
        RATIO_TYPES.CgtP,
        countdownLength,
        Buffer.from(staticMetadata)
      ];

      await assert.revertWith(
        this.TestOneWayGriefing.initializeOneWayGriefing(...initArgs),
        "must be called within contract constructor"
      );
    });
  });

  describe("OneWayGriefing.setVariableMetadata", () => {
    const stakerMetadata = "STAKER";
    const operatorMetadata = "OPERATOR";

    it("should revert when msg.sender is not staker or operator", async () => {
      // use the buyer to be the msg.sender
      await assert.revertWith(
        this.TestOneWayGriefing.from(buyer).setVariableMetadata(
          Buffer.from(stakerMetadata)
        ),
        "only staker or operator"
      );
    });

    it("should set variable metadata when msg.sender is staker", async () => {
      const txn = await this.TestOneWayGriefing.from(
        seller
      ).setVariableMetadata(Buffer.from(stakerMetadata));
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(stakerMetadata))
      );
    });

    it("should set variable metadata when msg.sender is operator", async () => {
      const txn = await this.TestOneWayGriefing.from(owner).setVariableMetadata(
        Buffer.from(operatorMetadata)
      );
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(
        txn,
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes(operatorMetadata))
      );
    });
  });

  describe("OneWayGriefing.startCountdown", () => {
    const startCountdown = async msgSender => {
      const txn = await this.TestOneWayGriefing.from(
        msgSender
      ).startCountdown();

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;
      const deadline = blockTimestamp + countdownLength;

      await assert.emit(txn, "DeadlineSet");
      await assert.emitWithArgs(txn, deadline);

      const actualDeadline = await this.TestOneWayGriefing.getDeadline();
      assert.equal(actualDeadline.toNumber(), deadline);
    };

    it("should revert when msg.sender is not staker or operator", async () => {
      // use the seller as the msg.sender
      await assert.revertWith(
        this.TestOneWayGriefing.from(buyer).startCountdown(),
        "only staker or operator"
      );
    });

    it("should start countdown when msg.sender is staker", async () =>
      await startCountdown(seller));

    it("should revert when deadline already set", async () =>
      await assert.revertWith(startCountdown(owner), "deadline already set"));

    it("should start countdown when msg.sender is owner", async () => {
      // it will throw when calling startCountdown again
      // re-deploy a new TestOneWayGriefing and initialize
      this.TestOneWayGriefing = await deployTestOneWayGriefing();

      await startCountdown(owner);
    });
  });

  describe("OneWayGriefing.increaseStake", () => {
    const funder = seller;
    let currentStake = 0; // to increment as we go
    let amountToAdd = 100; // 100 token weis

    it("should revert when msg.sender is not staker", async () => {
      // use the buyer to be the msg.sender
      await assert.revertWith(
        this.TestOneWayGriefing.from(buyer).increaseStake(
          funder,
          currentStake,
          amountToAdd
        ),
        "only staker or operator"
      );
    });

    it("should increase stake", async () => {
      await this.MockNMR.from(funder).approve(
        this.TestOneWayGriefing.contractAddress,
        amountToAdd
      );

      const txn = await this.TestOneWayGriefing.from(funder).increaseStake(
        funder,
        currentStake,
        amountToAdd
      );

      // increase the stake for later
      currentStake += amountToAdd;

      const receipt = await this.TestOneWayGriefing.verboseWaitForTransaction(
        txn
      );
      const expectedEvent = "StakeAdded";

      const stakeAddedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(stakeAddedEvent);
      assert.equal(stakeAddedEvent.args.staker, seller);
      assert.equal(stakeAddedEvent.args.funder, funder);
      assert.equal(stakeAddedEvent.args.amount.toNumber(), currentStake);
      assert.equal(stakeAddedEvent.args.newStake.toNumber(), amountToAdd);
    });

    it("should revert when countdown over", async () => {
      // get current blockTimestamp so we can reset later
      const block = await deployer.provider.getBlock("latest");
      const oldTimestamp = block.timestamp;

      // set to 1000 seconds after the deadline
      const timePastDeadline = 1000;
      const newTimestamp = oldTimestamp + countdownLength + timePastDeadline;
      await utils.setTimeTo(deployer.provider, newTimestamp);

      await assert.revertWith(
        this.TestOneWayGriefing.from(seller).increaseStake(
          funder,
          currentStake,
          amountToAdd
        ),
        "agreement ended"
      );
    });
  });

  describe("OneWayGriefing.punish", () => {
    const from = seller;
    const punishment = 100;
    const message = "I don't like you";
    const punishArgs = [from, punishment, Buffer.from(message)];

    it("should revert when not counterparty or operator", async () => {
      // seller is not counterparty or operator
      await assert.revertWith(
        this.TestOneWayGriefing.from(seller).punish(...punishArgs),
        "only counterparty or operator"
      );
    });

    // the time was set past deadline in the test before
    // we need to redeploy a new contract to reset the countdown
    // this is because there's no ability to wind back time in EVM
    it("should revert when agreement ended", async () => {
      await assert.revertWith(
        this.TestOneWayGriefing.from(buyer).punish(...punishArgs),
        "agreement ended"
      );

      this.TestOneWayGriefing = await deployTestOneWayGriefing();
    });

    it("should revert when no approval to burn tokens", async () => {
      await assert.revertWith(
        this.TestOneWayGriefing.from(buyer).punish(...punishArgs),
        "insufficient allowance"
      );
    });
  });
});
