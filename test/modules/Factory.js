const {
  createInstanceAddress,
  createEip1167RuntimeCode,
  getLatestContractAdressFrom,
  abiEncodeWithSelector,
  createSelector
} = require("../helpers/utils");

function testFactory(
  deployer, // etherlime's ganache deployer instance
  factoryName, // factory contract's name
  instanceType, // instance type created by factory
  createExplicitTypes, // the types used in create call
  createExplicitArgs, // the arguments used in create call
  factoryArtifact, // the factory artifact
  registryArtifact, // correct registry used to store instances & factories. instanceType must match
  wrongRegistryArtifact, // wrong registry for error testing. instanceType must mismatch

  factoryConstructorArgs,

  // There are cases where the create() call and the createExplicit() call differ
  // ABI types are different. Default to the create call parameters
  // anything else, pass in a different set of ABI
  createTypes = createExplicitTypes,
  getCreateArgs = () => createExplicitArgs
) {
  describe(factoryName, function () {

    // wallets and addresses
    const [operatorWallet, , creatorWallet] = accounts;
    const operator = operatorWallet.signer.signingKey.address;
    const creator = creatorWallet.signer.signingKey.address;

    // variables used in tests
    const initializeFunctionName = "initialize";
    const initSelector = createSelector(
      initializeFunctionName,
      createTypes
    );

    // variables used to track local instances
    let logicContractAddress;
    let nonce = 0;
    const totalInstanceCount = 4;
    let instances = [];
    let createArgs;

    before(async () => {
      this.Registry = await deployer.deploy(registryArtifact);
      this.WrongRegistry = await deployer.deploy(wrongRegistryArtifact);
      createArgs = getCreateArgs();
    });

    const createLocalInstance = salt => {
      // this should accomodate tests where createargs is different from initABI
      const { instanceAddress, callData } = createInstanceAddress(
        this.Factory.contractAddress,
        logicContractAddress,
        creator,
        initializeFunctionName,
        createTypes,
        createArgs,
        nonce,
        salt
      );

      instances.push(instanceAddress);
      if (!salt) {
        nonce++;
      }

      return { instanceAddress, callData };
    };

    const populateInstances = async count => {
      const callData = abiEncodeWithSelector(
        initializeFunctionName,
        createTypes,
        createArgs
      );
      for (let i = 0; i < count; i++) {
        await this.Factory.from(creator).create(callData);
        createLocalInstance();
      }
    };

    describe("Factory._initialize", () => {
      it("should revert when wrong instanceType for registry", async () => {
        await assert.revertWith(
          deployer.deploy(
            factoryArtifact,
            false,
            this.WrongRegistry.contractAddress,
            ...factoryConstructorArgs
          ),
          "incorrect instance type"
        );
      });

      it("should initialize factory correctly", async () => {
        this.Factory = await deployer.deploy(
          factoryArtifact,
          false,
          this.Registry.contractAddress,
          ...factoryConstructorArgs
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

        // Factory.getInitSelector
        const actualInitSelector = await this.Factory.getInitSelector();
        assert.equal(actualInitSelector, initSelector);

        // Factory.getInstanceRegistry
        const actualInstanceRegistry = await this.Factory.getInstanceRegistry();
        assert.equal(actualInstanceRegistry, this.Registry.contractAddress);

        // Factory.getTemplate
        logicContractAddress = await this.Factory.getTemplate();

        // register the factory into the registry
        await this.Registry.addFactory(
          this.Factory.contractAddress,
          Buffer.from("")
        );
      });
    });

    const validateCreateTxn = async (txn, salt, expectedAddress) => {
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

      const { instanceAddress, callData } = createLocalInstance(salt);

      assert.equal(instanceCreatedEvent.args.instance, instanceAddress);
      assert.equal(instanceCreatedEvent.args.callData, callData);

      if (expectedAddress) {
        assert.equal(instanceCreatedEvent.args.instance, expectedAddress);
      }

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
        const expectedAddress = await this.Factory.from(
          creator
        ).getNextInstance(callData);
        const txn = await this.Factory.from(creator).create(callData);
        await validateCreateTxn(txn, null, expectedAddress);
      });
    });

    describe(`${factoryName}.createSalty`, () => {
      it("should create instance correctly", async () => {
        const callData = abiEncodeWithSelector(
          initializeFunctionName,
          createTypes,
          createArgs
        );
        const testSalt = ethers.utils.formatBytes32String("testSalt");
        const txn = await this.Factory.from(creator).createSalty(
          callData,
          testSalt
        );
        const expectedAddress = await this.Factory.from(
          creator
        ).getSaltyInstance(callData, testSalt);
        await validateCreateTxn(txn, testSalt, expectedAddress);
      });

      it("should revert with duplicate salt", async () => {
        const callData = abiEncodeWithSelector(
          initializeFunctionName,
          createTypes,
          createArgs
        );
        const testSalt = ethers.utils.formatBytes32String("testSalt");
        await assert.revertWith(
          this.Factory.from(creator).createSalty(callData, testSalt),
          "contract already deployed with supplied salt"
        );
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
