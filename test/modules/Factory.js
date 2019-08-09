const { createDeployer } = require("../helpers/setup");
const { RATIO_TYPES } = require("../helpers/variables");
const {
  createInstanceAddress,
  createEip1167RuntimeCode,
  createInstanceAddressWithInitData,
  createSelector
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
  const initializeFunctionName = "initialize";

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

  const createLocalInstance = () => {
    const { instanceAddress, callData } = createInstanceAddress(
      this.OWGFactory.contractAddress,
      logicContractAddress,
      seller,
      initializeFunctionName,
      initABITypes,
      [this.MockNMR.contractAddress, ...createArgs],
      nonce
    );

    instances.push(instanceAddress);
    nonce++;

    return { instanceAddress, callData };
  };

  const populateInstances = async count => {
    for (let i = 0; i < count; i++) {
      await this.OWGFactory.from(seller).createExplicit(
        this.MockNMR.contractAddress,
        ...createArgs
      );

      createLocalInstance();
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

      // register the factory into the registry
      await this.Registry.from(owner).addFactory(
        this.OWGFactory.contractAddress,
        Buffer.from("")
      );
    });
  });

  const validateCreateExplicitTxn = async txn => {
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

    const { instanceAddress, callData } = createLocalInstance();

    assert.equal(instanceCreatedEvent.args.instance, instanceAddress);
    assert.equal(instanceCreatedEvent.args.callData, callData);

    // check the EIP1167 runtime code

    const actualRuntimeCode = await deployer.provider.getCode(instanceAddress);
    const runtimeCode = createEip1167RuntimeCode(logicContractAddress);
    assert.equal(actualRuntimeCode, runtimeCode);
  };

  describe("Factory.create", () => {
    const abiEncoder = new ethers.utils.AbiCoder();

    it("should revert with missing argument in ABI", async () => {
      const wrongABITypes = [
        // "address", missing this first argument
        "address",
        "address",
        "address",
        "uint256",
        "uint8",
        "uint256",
        "bytes"
      ];

      const initData = abiEncoder.encode(wrongABITypes, [
        // this.MockNMR.contractAddress,
        ...createArgs
      ]);

      await assert.revert(this.OWGFactory.from(seller).create(initData));
    });

    it("should revert with different type in ABI", async () => {
      const wrongABITypes = [
        "uint256",
        "address",
        "address",
        "address",
        "uint256",
        "uint8",
        "uint256",
        "bytes"
      ];

      const replacementAddress = 123;

      const initData = abiEncoder.encode(wrongABITypes, [
        replacementAddress,
        ...createArgs
      ]);

      await this.OWGFactory.from(seller).create(initData);

      // use correct selector, not with the wrong ABI
      const selector = createSelector(
        initializeFunctionName,
        initABITypes
      );

      const { instanceAddress } = createInstanceAddressWithInitData(
        this.OWGFactory.contractAddress,
        logicContractAddress,
        seller,
        selector,
        initData,
        nonce
      );

      instances.push(instanceAddress);

      // dont increment nonce because next parameters are different
      // nonce only increments when parameters are the same
    });

    it("should create instance correctly", async () => {
      const initData = abiEncoder.encode(initABITypes, [
        this.MockNMR.contractAddress,
        ...createArgs
      ]);

      const txn = await this.OWGFactory.from(seller).create(initData);

      await validateCreateExplicitTxn(txn);
    });
  });

  describe("Factory.createExplicit", () => {
    it("should create instance correctly", async () => {
      // seller creates the OneWayGriefing instance
      const txn = await this.OWGFactory.from(seller).createExplicit(
        this.MockNMR.contractAddress,
        ...createArgs
      );

      await validateCreateExplicitTxn(txn);
    });
  });

  describe("Factory.getInstanceCount", () => {
    it("should get correct instance count", async () => {
      const populateCount = 5;
      await populateInstances(populateCount); // -1 because we created 1 instance before this

      const actualCount = await this.OWGFactory.getInstanceCount();
      assert.equal(actualCount.toNumber(), instances.length);
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
          instances.length - 1,
          instances.length + 1
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
