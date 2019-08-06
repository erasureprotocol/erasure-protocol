const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");

const OneWayGriefing_FactoryArtifact = require("../../build/OneWayGriefing_Factory.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");
// const TestOneWayGriefingArtifact = require("../../build/TestOneWayGriefing.json");
// const MockNMRArtifact = require("../../build/MockNMR.json");

describe("Factory", function() {
  this.timeout(4000);

  // wallets and addresses
  const [ownerWallet, buyerWallet, sellerWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const buyer = buyerWallet.signer.signingKey.address;
  const seller = sellerWallet.signer.signingKey.address;

  // variables used in initialize()
  const sellerStake = 500;
  const punishment = 100;
  const ratio = 2;
  const ratioType = RATIO_TYPES.CgtP;
  const countdownLength = 1000;
  const staticMetadata = "TESTING";

  let deployer;

  before(async () => {
    deployer = createDeployer();

    this.registry = await deployer.deploy(ErasureAgreementsRegistryArtifact);
    this.wrongRegistry = await deployer.deploy(ErasurePostsRegistryArtifact);
  });

  describe("Factory._initialize", () => {
    it("should revert when wrong instanceType for registry", async () => {
      await assert.revertWith(
        deployer.deploy(
          OneWayGriefing_FactoryArtifact,
          false,
          this.wrongRegistry.contractAddress
        ),
        "incorrect instance type"
      );
    });

    it("should initialize factory correctly", async () => {
      this.OWGFactory = await deployer.deploy(
        OneWayGriefing_FactoryArtifact,
        false,
        this.registry.contractAddress
      );

      // Factory.getInstanceType
      const expectedInstanceType = "Agreement";
      const instanceType = await this.OWGFactory.getInstanceType();
      assert.equal(
        instanceType,
        // instanceType is a bytes4
        ethers.utils.hexDataSlice(
          ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(expectedInstanceType)
          ),
          0,
          4
        )
      );

      // Factory.getInitABI
      const expectedABI =
        "(bytes4,address,address,address,address,uint256,Griefing.RatioType,uint256,bytes)";
      const actualABI = await this.OWGFactory.getInitABI();
      assert.equal(actualABI, expectedABI);

      // Factory.getInstanceRegistry
      const actualInstanceRegistry = await this.OWGFactory.getInstanceRegistry();
      assert.equal(actualInstanceRegistry, this.registry.contractAddress);

      // Factory.getTemplate
      const nonce = await deployer.provider.getTransactionCount(
        this.OWGFactory.contractAddress
      );
      const expectedTemplateAddress = ethers.utils.getContractAddress({
        from: this.OWGFactory.contractAddress,
        nonce: nonce - 1
      });

      const actualTemplateAddress = await this.OWGFactory.getTemplate();
      assert.equal(actualTemplateAddress, expectedTemplateAddress);
    });
  });
});
