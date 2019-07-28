const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");

const OneWayGriefingArtifact = require("../../build/OneWayGriefing.json");
const TestOneWayGriefingArtifact = require("../../build/TestOneWayGriefing.json");
const MockNMRArtifact = require("../../build/MockNMR.json");

describe("OneWayGriefing", function() {
  this.timeout(4000);

  const [ownerWallet, buyerWallet, sellerWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const buyer = buyerWallet.signer.signingKey.address;
  const seller = sellerWallet.signer.signingKey.address;

  let deployer;
  before(async () => {
    deployer = createDeployer();

    this.OneWayGriefing = await deployer.deploy(OneWayGriefingArtifact);
    this.MockNMR = await deployer.deploy(MockNMRArtifact);

    // fill the token balances of the buyer and seller
    // buyer & seller has 1,000 tokens each
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
    const ratio = 2;
    const countdownLength = 1000;
    const staticMetadata = "TESTING";

    it("should revert when caller is not contract", async () => {
      await assert.revertWith(
        this.OneWayGriefing.initialize(
          this.MockNMR.contractAddress,
          owner,
          seller,
          buyer,
          ratio,
          RATIO_TYPES.CgtP,
          countdownLength,
          Buffer.from(staticMetadata)
        ),
        "must be called within contract constructor"
      );
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

      testContract = await deployer.deploy(
        TestOneWayGriefingArtifact,
        false,
        ...initArgs
      );

      await assert.revertWith(
        testContract.initializeOneWayGriefing(...initArgs),
        "must be called within contract constructor"
      );
    });

    it("should initialize contract", async () => {
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

      // sets TestOneWayGriefing property to be used
      // by rest of the tests
      this.TestOneWayGriefing = await deployer.deploy(
        TestOneWayGriefingArtifact,
        false,
        ...initArgs
      );
    });
  });
});
