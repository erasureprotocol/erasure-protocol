const { createDeployer } = require("./helpers/setup");

const RATIO_TYPES = {
  NaN: 0,
  CgtP: 1,
  CltP: 2,
  CeqP: 3,
  Inf: 4
};

describe("Griefing", function() {
  this.timeout(4000);

  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    TestGriefing: {
      artifact: require("../build/TestGriefing.json")
    },
    MockNMR: {
      artifact: require("../build/MockNMR.json")
    }
  };

  let deployer;
  before(() => {
    deployer = createDeployer();
  });

  beforeEach(async () => {
    contracts.TestGriefing.instance = await deployer.deploy(
      contracts.TestGriefing.artifact
    );
    contracts.MockNMR.instance = await deployer.deploy(
      contracts.MockNMR.artifact
    );

    const owner = wallets.numerai.signer.signingKey.address;
    const buyer = wallets.buyer.signer.signingKey.address;
    const seller = wallets.seller.signer.signingKey.address;

    const tokenAddress = contracts.MockNMR.instance.contractAddress;
    await contracts.TestGriefing.instance.from(owner).setToken(tokenAddress);

    // fill the token balances of the buyer and seller
    // buyer & seller has 1,000 tokens each
    await contracts.MockNMR.instance
      .from(owner)
      .transfer(buyer, ethers.utils.parseEther("1000"));
    await contracts.MockNMR.instance
      .from(owner)
      .transfer(seller, ethers.utils.parseEther("1000"));
  });

  // test pure functions

  describe("Griefing.getCost", () => {
    const punishment = 10;
    const ratio = 2;

    it("should revert when ratioType is NaN (no punishment)", async () => {
      // no calculation can be made when no punishment is allowed
      await assert.revertWith(
        contracts.TestGriefing.instance.getCost(
          ratio,
          punishment,
          RATIO_TYPES.NaN
        ),
        "ratioType cannot be RatioType.NaN"
      );
    });

    it("should getCost for ratioType CgtP correctly", async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ratio,
        punishment,
        RATIO_TYPES.CgtP
      );
      assert.equal(cost.toNumber(), punishment * ratio);
    });

    it("should getCost for ratioType CltP correctly", async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ratio,
        punishment,
        RATIO_TYPES.CltP
      );
      assert.equal(cost.toNumber(), punishment / ratio);
    });

    it("should getCost for ratioType CeqP correctly", async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ratio,
        punishment,
        RATIO_TYPES.CeqP
      );
      assert.equal(cost.toNumber(), punishment);
    });

    it("should getCost for ratioType Inf correctly", async () => {
      const cost = await contracts.TestGriefing.instance.getCost(
        ratio,
        punishment,
        RATIO_TYPES.Inf
      );
      assert.equal(cost.toNumber(), 0);
    });
  });

  describe("Griefing.getPunishment", () => {
    const cost = 20;
    const ratio = 2;

    it("should revert when ratioType is NaN (no punishment)", async () => {
      // no calculation can be made when no punishment is allowed
      await assert.revertWith(
        contracts.TestGriefing.instance.getPunishment(
          ratio,
          cost,
          RATIO_TYPES.NaN
        ),
        "ratioType cannot be RatioType.NaN"
      );
    });

    it("should revert when ratioType is Inf (punishment at no cost)", async () => {
      // no calculation can be made when no cost to be computed from
      await assert.revertWith(
        contracts.TestGriefing.instance.getPunishment(
          ratio,
          cost,
          RATIO_TYPES.Inf
        ),
        "ratioType cannot be RatioType.Inf"
      );
    });

    it("should getCost for ratioType CgtP correctly", async () => {
      const punishment = await contracts.TestGriefing.instance.getPunishment(
        ratio,
        cost,
        RATIO_TYPES.CgtP
      );
      assert.equal(punishment.toNumber(), cost / ratio);
    });

    it("should getCost for ratioType CltP correctly", async () => {
      const punishment = await contracts.TestGriefing.instance.getPunishment(
        ratio,
        cost,
        RATIO_TYPES.CltP
      );
      assert.equal(punishment.toNumber(), cost * ratio);
    });

    it("should getCost for ratioType CeqP correctly", async () => {
      const punishment = await contracts.TestGriefing.instance.getPunishment(
        ratio,
        cost,
        RATIO_TYPES.CeqP
      );
      assert.equal(punishment.toNumber(), cost);
    });
  });

  // test state functions

  describe("Griefing._setRatio", () => {
    const seller = wallets.seller.signer.signingKey.address;
    const ratio = 2;
    const ratioType = RATIO_TYPES.CgtP;

    it("should revert on wrong ratioType", async () => {
      const invalidRatioTypeEnumVal = 5;
      await assert.revert(
        contracts.TestGriefing.instance.setRatio(
          seller,
          ratio,
          invalidRatioTypeEnumVal
        )
      );
    });

    it("should set ratio correctly", async () => {
      const txn = await contracts.TestGriefing.instance.setRatio(
        seller,
        ratio,
        ratioType
      );
      await assert.emit(txn, "RatioSet");
      await assert.emitWithArgs(txn, [seller, ratio, ratioType]);

      const [
        actualRatio,
        actualRatioType
      ] = await contracts.TestGriefing.instance.getRatio(seller);
      assert.equal(actualRatio, ratio);
      assert.equal(actualRatioType, ratioType);
    });
  });

  describe("Griefing._grief", () => {
    const seller = wallets.seller.signer.signingKey.address;
    const buyer = wallets.buyer.signer.signingKey.address;
    const ratio = 2;
    const stakeAmount = 100;
    const punishment = 10;
    const ratioType = RATIO_TYPES.CgtP;
    const message = "I don't like you";

    it("should revert when token not set", async () => {
      await contracts.TestGriefing.instance.setToken(
        ethers.constants.AddressZero
      );

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        "token not set"
      );
    });

    it("should revert when grief ratio not set", async () => {
      await assert.revertWith(
        contracts.TestGriefing.instance.grief(
          buyer,
          seller,
          punishment,
          Buffer.from(message)
        ),
        "no punishment allowed"
      );
    });

    it("should revert when not approved to burn", async () => {
      await contracts.TestGriefing.instance.setRatio(seller, ratio, ratioType);

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        "SafeMath: subtraction overflow"
      );
    });

    it("should revert when buyer approve lesser than punishment", async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress;

      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType);

      const wrongApproveAmount = punishment - 1;
      await contracts.MockNMR.instance
        .from(buyer)
        .approve(contractAddress, wrongApproveAmount);

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        "SafeMath: subtraction overflow"
      );
    });

    it("should revert when seller has not staked anything", async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress;

      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType);
      await contracts.MockNMR.instance
        .from(buyer)
        .approve(contractAddress, punishment);

      await assert.revert(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message))
      );
    });

    it("should revert when seller has too little stake", async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress;

      // seller process
      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType);

      await contracts.MockNMR.instance
        .from(seller)
        .approve(contractAddress, punishment - 1);

      await contracts.TestGriefing.instance
        .from(seller)
        .addStake(seller, seller, 0, punishment - 1);

      // buyer process
      await contracts.MockNMR.instance
        .from(buyer)
        .approve(contractAddress, punishment * ratio);

      await assert.revertWith(
        contracts.TestGriefing.instance
          .from(buyer)
          .grief(buyer, seller, punishment, Buffer.from(message)),
        "cannot burn more than currentStake"
      );
    });

    it("should grief correctly", async () => {
      const contractAddress = contracts.TestGriefing.instance.contractAddress;

      // seller process
      await contracts.TestGriefing.instance
        .from(seller)
        .setRatio(seller, ratio, ratioType);

      await contracts.MockNMR.instance
        .from(seller)
        .approve(contractAddress, stakeAmount);

      await contracts.TestGriefing.instance
        .from(seller)
        .addStake(seller, seller, 0, stakeAmount);

      // buyer process
      await contracts.MockNMR.instance
        .from(buyer)
        .approve(contractAddress, punishment * ratio);

      await contracts.TestGriefing.instance
        .from(buyer)
        .grief(buyer, seller, punishment, Buffer.from(message));

      const griefCost = await contracts.TestGriefing.instance.getGriefCost();
      assert.equal(griefCost, punishment * ratio);
    });
  });
});
