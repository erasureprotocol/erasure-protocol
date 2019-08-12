const {
  createInstanceAddress,
  createEip1167RuntimeCode,
  getLatestContractAdressFrom
} = require("../helpers/utils");

function testFactory(
  deployer, // etherlime's ganache deployer instance
  factoryName, // factory contract's name
  initDataABI, // the init data ABI string stated in factory contract used for matching
  callDataABI, //  the call data ABI string stated in factory contract, usually just initDataABI but prepended with selector (bytes4)
  createTypes, // the actual types used to encode the init data ABI function parameters
  createArgs, // the actual types used to encode init data values
  factoryArtifact, // the factory artifact
  registryArtifact, // correct registry used to store instances & factories. instanceType must match
  wrongRegistryArtifact // wrong registry for error testing. instanceType must mismatch
) {
  describe(factoryName, function() {
    this.timeout(4000);

    // wallets and addresses
    const [ownerWallet, buyerWallet, sellerWallet] = accounts;
    const owner = ownerWallet.signer.signingKey.address;
    const buyer = buyerWallet.signer.signingKey.address;
    const seller = sellerWallet.signer.signingKey.address;

    const initializeFunctionName = "initialize";

    let logicContractAddress;
    let nonce = 0;
    const totalInstanceCount = 5;
    let instances = [];

    before(async () => {
      this.Registry = await deployer.deploy(registryArtifact);
      this.WrongRegistry = await deployer.deploy(wrongRegistryArtifact);
    });

    const createLocalInstance = () => {
      const { instanceAddress, callData } = createInstanceAddress(
        this.OWGFactory.contractAddress,
        logicContractAddress,
        seller,
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
        await this.OWGFactory.from(seller).createExplicit(...createArgs);
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
        this.OWGFactory = await deployer.deploy(
          factoryArtifact,
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
          deployer.provider,
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

      const actualRuntimeCode = await deployer.provider.getCode(
        instanceAddress
      );
      const runtimeCode = createEip1167RuntimeCode(logicContractAddress);
      assert.equal(actualRuntimeCode, runtimeCode);
    };

    describe(`${factoryName}.create`, () => {
      const abiEncoder = new ethers.utils.AbiCoder();

      it("should revert with missing argument in ABI", async () => {
        const wrongCreateTypes = createTypes.slice(1);
        const wrongCreateArgs = createArgs.slice(1);
        const initData = abiEncoder.encode(wrongCreateTypes, wrongCreateArgs);
        await assert.revert(this.OWGFactory.from(seller).create(initData));
      });

      it("should create instance correctly", async () => {
        const initData = abiEncoder.encode(createTypes, createArgs);
        const txn = await this.OWGFactory.from(seller).create(initData);
        await validateCreateExplicitTxn(txn);
      });
    });

    describe(`${factoryName}.createExplicit`, () => {
      it("should create instance correctly", async () => {
        // seller creates the OneWayGriefing instance
        const txn = await this.OWGFactory.from(seller).createExplicit(
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
        assert.deepEqual(
          actualInstances,
          instances.slice(startIndex, endIndex)
        ); // deepEqual because array comparison

        startIndex = 3;
        endIndex = 5;
        actualInstances = await this.OWGFactory.getPaginatedInstances(
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
