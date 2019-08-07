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
  const ratio = 2;
  const ratioType = RATIO_TYPES.CgtP;
  const countdownLength = 1000;
  const staticMetadata = "TESTING";

  const initABITypes = [
    "address",
    "address",
    "address",
    "address",
    "uint256",
    "uint8",
    "uint256",
    "bytes"
  ];
  const initDataABI =
    "(address,address,address,address,uint256,Griefing.RatioType,uint256,bytes)";
  const callDataABI =
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
  let logicContractAddress;
  let nonce = 0;
  const totalInstanceCount = 5;
  let instances = [];

  before(async () => {
    deployer = createDeployer();

    this.MockNMR = await deployer.deploy(MockNMRArtifact);
    this.Registry = await deployer.deploy(ErasureAgreementsRegistryArtifact);
    this.WrongRegistry = await deployer.deploy(ErasurePostsRegistryArtifact);
  });

  const populateInstances = async count => {
    for (let i = 0; i < count; i++) {
      await this.OWGFactory.from(seller).createExplicit(
        this.MockNMR.contractAddress,
        ...createArgs
      );

      const { instanceAddress } = createInstanceAddress(
        this.OWGFactory.contractAddress,
        logicContractAddress,
        seller,
        "initialize",
        initABITypes,
        [this.MockNMR.contractAddress, ...createArgs],
        nonce
      );

      instances.push(instanceAddress);
      nonce++;
    }
  };

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

      // Factory.getInitdataABI
      const actualInitdataABI = await this.OWGFactory.getInitdataABI();
      assert.equal(actualInitdataABI, initDataABI);

      // Factory.getCalldataABI
      const actualCalldataABI = await this.OWGFactory.getCalldataABI();
      assert.equal(actualCalldataABI, callDataABI);

      // Factory.getInstanceRegistry
      const actualInstanceRegistry = await this.OWGFactory.getInstanceRegistry();
      assert.equal(actualInstanceRegistry, this.Registry.contractAddress);

      // Factory.getTemplate
      logicContractAddress = await getLatestContractAdressFrom(
        this.OWGFactory.contractAddress
      );
      const actualTemplateAddress = await this.OWGFactory.getTemplate();
      assert.equal(actualTemplateAddress, logicContractAddress);
    });
  });

  describe("Factory.create", () => {
    it("should create instance correctly", async () => {
      await this.Registry.addFactory(
        this.OWGFactory.contractAddress,
        Buffer.from("")
      );

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
      assert.equal(instanceCreatedEvent.args.calldataABI, callDataABI);

      // test for correctness of proxy address generation

      const { instanceAddress, initData } = createInstanceAddress(
        this.OWGFactory.contractAddress,
        logicContractAddress,
        seller,
        "initialize",
        initABITypes,
        [this.MockNMR.contractAddress, ...createArgs],
        nonce
      );
      assert.equal(instanceCreatedEvent.args.instance, instanceAddress);
      assert.equal(instanceCreatedEvent.args.callData, initData);

      // check the EIP1167 runtime code

      const actualRuntimeCode = await deployer.provider.getCode(
        instanceAddress
      );
      const runtimeCode = createEip1167RuntimeCode(logicContractAddress);
      assert.equal(actualRuntimeCode, runtimeCode);

      // test instance retrieval view functions

      const actualInstanceAddress = await this.OWGFactory.getInstance(nonce);
      assert.equal(actualInstanceAddress, instanceAddress);

      // push to instances array to be checked against later
      instances.push(instanceAddress);

      // increase nonce after use for next instance address generation
      nonce++;

      // const instances = await this.OWGFactory.getInstances();
      // assert.deepEqual(instances, [instanceAddress]);
    });
  });

  describe("Factory.getInstanceCount", () => {
    it("should get correct instance count", async () => {
      await populateInstances(totalInstanceCount - 1); // -1 because we created 1 instance before this

      const actualCount = await this.OWGFactory.getInstanceCount();
      assert.equal(actualCount, totalInstanceCount);
    });
  });

  describe("Factory.getInstance", () => {
    it("should get instance correctly", async () => {
      // iterate thru all the instance index and check against the instances array
      // ensure that the order is preserved
      for (let i = 0; i < totalInstanceCount; i++) {
        const actualInstanceAddress = await this.OWGFactory.getInstance(i);
        const expectedInstanceAddress = instances[i];
        assert.equal(actualInstanceAddress, expectedInstanceAddress);
      }
    });
  });

  describe("Factory.getInstances", () => {
    it("should get all instances correctly", async () => {
      // check that both instance arrays from blockchain and locally match
      const actualInstances = await this.OWGFactory.getInstances();
      assert.deepEqual(actualInstances, instances); // deepEqual because array comparison
    });
  });

  describe("Factory.getPaginatedInstances", () => {
    it("should revert when startIndex >= endIndex", async () => {
      await assert.revertWith(
        this.OWGFactory.getPaginatedInstances(3, 2),
        "startIndex must be less than endIndex"
      );
    });

    it("should revert when endIndex > instances.length", async () => {
      await assert.revertWith(
        this.OWGFactory.getPaginatedInstances(
          totalInstanceCount - 1,
          totalInstanceCount + 1
        ),
        "end index out of range"
      );
    });

    it("should get paginated instances correctly", async () => {
      let startIndex = 0;
      let endIndex = 3;
      let actualInstances = await this.OWGFactory.getPaginatedInstances(
        startIndex,
        endIndex
      );
      assert.deepEqual(actualInstances, instances.slice(startIndex, endIndex)); // deepEqual because array comparison

      startIndex = 3;
      endIndex = 5;
      actualInstances = await this.OWGFactory.getPaginatedInstances(
        startIndex,
        endIndex
      );
      assert.deepEqual(actualInstances, instances.slice(startIndex, endIndex)); // deepEqual because array comparison
    });
  });
});
