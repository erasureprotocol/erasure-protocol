const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");
const {
  createInstanceAddress,
  createEip1167RuntimeCode
} = require("../helpers/utils");

const OneWayGriefing_FactoryArtifact = require("../../build/OneWayGriefing_Factory.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");
const MockNMRArtifact = require("../../build/MockNMR.json");

const getLatestContractAdressFrom = async address => {
  const nonce = await deployer.provider.getTransactionCount(address);
  const contractAddress = ethers.utils.getContractAddress({
    from: address,
    nonce: nonce - 1
  });
  return contractAddress;
};

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
  const expectedABI =
    "(bytes4,address,address,address,address,uint256,Griefing.RatioType,uint256,bytes)";

  const createArgs = [
    owner,
    seller,
    buyer,
    ratio,
    ratioType,
    countdownLength,
    Buffer.from(staticMetadata)
  ];

  let deployer;

  before(async () => {
    deployer = createDeployer();

    this.MockNMR = await deployer.deploy(MockNMRArtifact);
    this.Registry = await deployer.deploy(ErasureAgreementsRegistryArtifact);
    this.WrongRegistry = await deployer.deploy(ErasurePostsRegistryArtifact);
  });

  describe("Factory._initialize", () => {
    it("should revert when wrong instanceType for registry", async () => {
      await assert.revertWith(
        deployer.deploy(
          OneWayGriefing_FactoryArtifact,
          false,
          this.WrongRegistry.contractAddress
        ),
        "incorrect instance type"
      );
    });

    it("should initialize factory correctly", async () => {
      this.OWGFactory = await deployer.deploy(
        OneWayGriefing_FactoryArtifact,
        false,
        this.Registry.contractAddress
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
      const actualABI = await this.OWGFactory.getInitABI();
      assert.equal(actualABI, expectedABI);

      // Factory.getInstanceRegistry
      const actualInstanceRegistry = await this.OWGFactory.getInstanceRegistry();
      assert.equal(actualInstanceRegistry, this.Registry.contractAddress);

      // Factory.getTemplate
      const expectedTemplateAddress = await getLatestContractAdressFrom(
        this.OWGFactory.contractAddress
      );
      const actualTemplateAddress = await this.OWGFactory.getTemplate();
      assert.equal(actualTemplateAddress, expectedTemplateAddress);
    });
  });

  describe("Factory.create", () => {
    it("should create instance correctly", async () => {
      await this.Registry.addFactory(
        this.OWGFactory.contractAddress,
        Buffer.from("")
      );

      const logicContract = await this.OWGFactory.getTemplate();

      // seller creates the OneWayGriefing instance
      const txn = await this.OWGFactory.from(seller).createExplicit(
        this.MockNMR.contractAddress,
        ...createArgs
      );

      const receipt = await this.OWGFactory.verboseWaitForTransaction(txn);

      const expectedEvent = "InstanceCreated";
      const instanceCreatedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(instanceCreatedEvent);
      assert.equal(instanceCreatedEvent.args.creator, seller);
      assert.equal(instanceCreatedEvent.args.initABI, expectedABI);

      const { targetAddress, initData } = createInstanceAddress(
        seller,
        this.OWGFactory.contractAddress,
        logicContract,
        "initialize",
        [
          "address",
          "address",
          "address",
          "address",
          "uint256",
          "uint8",
          "uint256",
          "bytes"
        ],
        [this.MockNMR.contractAddress, ...createArgs],
        0
      );
      assert.equal(instanceCreatedEvent.args.instance, targetAddress);
      assert.equal(instanceCreatedEvent.args.initData, initData);

      const actualRuntimeCode = await deployer.provider.getCode(targetAddress);
      const runtimeCode = createEip1167RuntimeCode(logicContract);
      assert.equal(actualRuntimeCode, runtimeCode);
    });
  });
});
