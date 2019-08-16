const {
  createInstanceAddress,
  createEip1167RuntimeCode,
  getLatestContractAdressFrom,
  abiEncodeWithSelector
} = require("../helpers/utils");

function testFactory(
  deployer, // etherlime's ganache deployer instance
  factoryName, // factory contract's name
  instanceType, // instance type created by factory
  createTypes, // the actual types used to encode the init data ABI function parameters
  createArgs, // the actual types used to encode init data values
  factoryArtifact, // the factory artifact
  registryArtifact, // correct registry used to store instances & factories. instanceType must match
  wrongRegistryArtifact // wrong registry for error testing. instanceType must mismatch

  // There are cases where the create() call and the instance address creation's
  // ABI types are different. Default to the create call parameters
  // anything else, pass in a different set of ABI
  // createInstanceTypes = createTypes,
  // createInstanceArgs = createArgs
) {
  describe(factoryName, function() {
    this.timeout(4000);

    // wallets and addresses
    const [operatorWallet, , creatorWallet] = accounts;
    const operator = operatorWallet.signer.signingKey.address;
    const creator = creatorWallet.signer.signingKey.address;

    // variables used in tests
    const initializeFunctionName = "initialize";
    const initDataABI = "(" + createTypes.join(",") + ")";

    // variables used to track local instances
    let logicContractAddress;
    let nonce = 0;
    const totalInstanceCount = 5;
    let instances = [];

    before(async () => {
      this.Registry = await deployer.deploy(registryArtifact);
      this.WrongRegistry = await deployer.deploy(wrongRegistryArtifact);
    });

    const createLocalInstance = () => {
      // this should accomodate tests where createargs is different from initABI
      const { instanceAddress, callData } = createInstanceAddress(
        this.Factory.contractAddress,
        logicContractAddress,
        creator,
        initializeFunctionName,
        createTypes,
        createArgs,
        nonce
      );

      instances.push(instanceAddress);
      nonce++;

      return { instanceAddress, callData };
    };

    const populateInstances = async count => {
      for (let i = 0; i < count; i++) {
        await this.Factory.from(creator).createExplicit(...createArgs);
        createLocalInstance();
      }
    };

    describe("Factory._initialize", () => {
      it("should revert when wrong instanceType for registry", async () => {
        await assert.revertWith(
          deployer.deploy(
            factoryArtifact,
            false,
            this.WrongRegistry.contractAddress
          ),
          "incorrect instance type"
        );
      });

      it("should initialize factory correctly", async () => {
        this.Factory = await deployer.deploy(
          factoryArtifact,
          false,
          this.Registry.contractAddress
        );

        // Factory.getInstanceType
        const actualInstanceType = await this.Factory.getInstanceType();
        assert.equal(
          actualInstanceType,
          // instanceType is a bytes4
          ethers.utils.hexDataSlice(
            ethers.utils.keccak256(ethers.utils.toUtf8Bytes(instanceType)),
            0,
            4
          )
        );

        // Factory.getInitdataABI
        const actualInitdataABI = await this.Factory.getInitdataABI();
        assert.equal(actualInitdataABI, initDataABI);

        // Factory.getInstanceRegistry
        const actualInstanceRegistry = await this.Factory.getInstanceRegistry();
        assert.equal(actualInstanceRegistry, this.Registry.contractAddress);

        // Factory.getTemplate
        logicContractAddress = await getLatestContractAdressFrom(
          deployer.provider,
          this.Factory.contractAddress
        );
        const actualTemplateAddress = await this.Factory.getTemplate();
        assert.equal(actualTemplateAddress, logicContractAddress);

        // register the factory into the registry
        await this.Registry.from(operator).addFactory(
          this.Factory.contractAddress,
          Buffer.from("")
        );
      });
    });

    const validateCreateExplicitTxn = async txn => {
      const receipt = await this.Factory.verboseWaitForTransaction(txn);

      const expectedEvent = "InstanceCreated";
      const instanceCreatedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      // check the emitted event's arguments

      assert.isDefined(instanceCreatedEvent);
      assert.equal(instanceCreatedEvent.args.creator, creator);

      // test for correctness of proxy address generation

      const { instanceAddress, callData } = createLocalInstance();

      assert.equal(instanceCreatedEvent.args.instance, instanceAddress);
      assert.equal(instanceCreatedEvent.args.callData, callData);

      // check the EIP1167 runtime code

      const actualRuntimeCode = await deployer.provider.getCode(
        instanceAddress
      );
      const runtimeCode = createEip1167RuntimeCode(logicContractAddress);
      assert.equal(actualRuntimeCode, runtimeCode);
    };

    describe(`${factoryName}.create`, () => {
      it("should create instance correctly", async () => {
        const callData = abiEncodeWithSelector(
          initializeFunctionName,
          createTypes,
          createArgs
        );
        const txn = await this.Factory.from(creator).create(callData);
        await validateCreateExplicitTxn(txn);
      });
    });

    describe(`${factoryName}.createEncoded`, () => {
      const abiEncoder = new ethers.utils.AbiCoder();

      it("should create instance correctly", async () => {
        const initData = abiEncoder.encode(createTypes, createArgs);
        const txn = await this.Factory.from(creator).createEncoded(initData);
        await validateCreateExplicitTxn(txn);
      });
    });

    describe(`${factoryName}.createExplicit`, () => {
      it("should create instance correctly", async () => {
        // creator creates the OneWayGriefing instance
        const txn = await this.Factory.from(creator).createExplicit(
          ...createArgs
        );

        await validateCreateExplicitTxn(txn);
      });
    });

    describe("Factory.getInstanceCount", () => {
      it("should get correct instance count", async () => {
        const populateCount = 5;
        await populateInstances(populateCount); // -1 because we created 1 instance before this

        const actualCount = await this.Factory.getInstanceCount();
        assert.equal(actualCount.toNumber(), instances.length);
      });
    });

    describe("Factory.getInstance", () => {
      it("should get instance correctly", async () => {
        // iterate thru all the instance index and check against the instances array
        // ensure that the order is preserved
        for (let i = 0; i < totalInstanceCount; i++) {
          const actualInstanceAddress = await this.Factory.getInstance(i);
          const expectedInstanceAddress = instances[i];
          assert.equal(actualInstanceAddress, expectedInstanceAddress);
        }
      });
    });

    describe("Factory.getInstances", () => {
      it("should get all instances correctly", async () => {
        // check that both instance arrays from blockchain and locally match
        const actualInstances = await this.Factory.getInstances();
        assert.deepEqual(actualInstances, instances); // deepEqual because array comparison
      });
    });

    describe("Factory.getPaginatedInstances", () => {
      it("should revert when startIndex >= endIndex", async () => {
        await assert.revertWith(
          this.Factory.getPaginatedInstances(3, 2),
          "startIndex must be less than endIndex"
        );
      });

      it("should revert when endIndex > instances.length", async () => {
        await assert.revertWith(
          this.Factory.getPaginatedInstances(
            instances.length - 1,
            instances.length + 1
          ),
          "end index out of range"
        );
      });

      it("should get paginated instances correctly", async () => {
        let startIndex = 0;
        let endIndex = 3;
        let actualInstances = await this.Factory.getPaginatedInstances(
          startIndex,
          endIndex
        );
        assert.deepEqual(
          actualInstances,
          instances.slice(startIndex, endIndex)
        ); // deepEqual because array comparison

        startIndex = 3;
        endIndex = 5;
        actualInstances = await this.Factory.getPaginatedInstances(
          startIndex,
          endIndex
        );
        assert.deepEqual(
          actualInstances,
          instances.slice(startIndex, endIndex)
        ); // deepEqual because array comparison
      });
    });
  });
}

module.exports = testFactory;
