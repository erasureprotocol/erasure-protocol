const etherlime = require("etherlime-lib");

const { createDeployer } = require("../helpers/setup");
const {
  hexlify,
  createInstanceAddress,
  createInstanceAddressWithCallData,
  createSelector,
  createMultihashSha256,
  abiEncodeWithSelector
} = require("../helpers/utils");

// artifacts
const TestFeedArtifact = require("../../build/TestFeed.json");
const FeedFactoryArtifact = require("../../build/TestFeedFactory.json");
const PostFactoryArtifact = require("../../build/Post_Factory.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

describe("Feed", function() {
  this.timeout(4000);

  let deployer;

  // wallets and addresses
  const [creatorWallet, otherWallet, operatorWallet] = accounts;
  const creator = creatorWallet.signer.signingKey.address;
  const other = otherWallet.signer.signingKey.address;
  const operator = operatorWallet.signer.signingKey.address;

  // local Post array
  let posts = [];
  const addPost = postAddress => {
    posts.push(postAddress);
  };

  // post variables
  let nonce = 0;

  const proofHash = createMultihashSha256("proofHash");

  const postStaticMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("feedStaticMetadata")
  );
  const postVariableMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("feedVariableMetadata")
  );
  const createPostABITypes = ["address", "bytes", "bytes"];
  const createPostABIValues = [
    operator,
    proofHash,
    postStaticMetadata
  ];
  const createPostCallData = abiEncodeWithSelector(
    'initialize',
    createPostABITypes,
    createPostABIValues
  );

  // feed variables
  const feedStaticMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("feedStaticMetadata")
  );
  const feedVariableMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("feedVariableMetadata")
  );
  const newFeedVariableMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("newFeedVariableMetadata")
  );

  const deployTestFeed = async (
    validInit = true,
    args = [operator, feedStaticMetadata]
  ) => {
    let callData;

    if (validInit) {
      callData = abiEncodeWithSelector('initialize', ["address", "bytes"], args);
    } else {
      // invalid callData is missing first address
      callData = abiEncodeWithSelector('initialize', ["bytes"], [feedStaticMetadata]);
    }

    const txn = await this.FeedFactory.from(creator).create(callData);
    const receipt = await this.FeedFactory.verboseWaitForTransaction(txn);
    const expectedEvent = "InstanceCreated";
    const createFeedEvent = receipt.events.find(
      emittedEvent => emittedEvent.event === expectedEvent,
      "There is no such event"
    );
    // parse event logs to get new instance address
    // use new instance address to create contract object
    const feedAddress = createFeedEvent.args.instance;
    if (!validInit) {
      assert.equal(feedAddress, undefined);
    } else {
      const feedContract = deployer.wrapDeployedContract(
        TestFeedArtifact,
        feedAddress
      );
      return feedContract;
    }
  };

  before(async () => {
    deployer = await createDeployer();

    this.PostRegistry = await deployer.deploy(ErasurePostsArtifact);

    this.FeedFactory = await deployer.deploy(
      FeedFactoryArtifact,
      false,
      this.PostRegistry.contractAddress
    );

    await this.PostRegistry.from(creator).addFactory(
      this.FeedFactory.contractAddress,
      "0x"
    );

    // // template contract from FeedFactory
    this.FeedAddress = await this.FeedFactory.getTemplate();

    this.PostFactory = await deployer.deploy(
      PostFactoryArtifact,
      false,
      this.PostRegistry.contractAddress
    );
  });

  describe("Feed.initialize", () => {
    it("should revert when initialize with malformed init data", async () => {
      await assert.revert(deployTestFeed(false));
    });

    it("should initialize post", async () => {
      this.TestFeed = await deployTestFeed(true);

      // Operator._setOperator
      const actualOperator = await this.TestFeed.getOperator();
      assert.equal(actualOperator, operator);

      //  Operator._activateOperator()
      const operatorIsActive = await this.TestFeed.hasActiveOperator();
      assert.equal(operatorIsActive, true);
    });
  });

  describe("Feed.createPost", () => {
    // check operator access control
    it("should revert when msg.sender is not operator or creator", async () => {
      // Factory has to be the sender here
      await assert.revertWith(
        this.TestFeed.from(other).createPost(
          this.PostFactory.contractAddress,
          createPostCallData
        ),
        "only active operator or creator"
      );
    });

    // check deactivated operator
    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(operator).createPost(
          this.PostFactory.contractAddress,
          createPostCallData
        ),
        "only active operator or creator"
      );

      await this.TestFeed.activateOperator();
    });

    // factory must be registered
    it("should revert when factory not registered", async () => {
      await assert.revertWith(
        this.TestFeed.from(creator).createPost(
          this.PostFactory.contractAddress,
          createPostCallData
        ),
        "factory is not actively registered"
      );
    });

    // success case
    it("should create post successfully from creator", async () => {
      await this.PostRegistry.from(creator).addFactory(
        this.PostFactory.contractAddress,
        "0x"
      );

      const txn = await this.TestFeed.from(creator).createPost(
        this.PostFactory.contractAddress,
        createPostCallData
      );

      const receipt = await this.TestFeed.verboseWaitForTransaction(txn);

      const postTemplate = await this.PostFactory.getTemplate();

      const {
        instanceAddress: postAddress
      } = createInstanceAddressWithCallData(
        this.PostFactory.contractAddress,
        postTemplate,
        this.TestFeed.contractAddress,
        createPostCallData,
        nonce
      );
      addPost(postAddress);
      nonce++;

      let expectedEvent = "PostCreated";
      const postCreatedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(postCreatedEvent);
      assert.equal(postCreatedEvent.args.callData, createPostCallData);
      assert.equal(postCreatedEvent.args.post, postAddress);
      assert.equal(
        postCreatedEvent.args.postFactory,
        this.PostFactory.contractAddress
      );
    });

    it("should create post successfully from operator", async () => {
      const txn = await this.TestFeed.from(operator).createPost(
        this.PostFactory.contractAddress,
        createPostCallData
      );

      const receipt = await this.TestFeed.verboseWaitForTransaction(txn);

      const postTemplate = await this.PostFactory.getTemplate();

      const {
        instanceAddress: postAddress
      } = createInstanceAddressWithCallData(
        this.PostFactory.contractAddress,
        postTemplate,
        this.TestFeed.contractAddress,
        createPostCallData,
        nonce
      );
      addPost(postAddress);
      nonce++;

      let expectedEvent = "PostCreated";
      const postCreatedEvent = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );

      assert.isDefined(postCreatedEvent);
      assert.equal(postCreatedEvent.args.callData, createPostCallData);
      assert.equal(postCreatedEvent.args.post, postAddress);
      assert.equal(
        postCreatedEvent.args.postFactory,
        this.PostFactory.contractAddress
      );
    });

    // post factory does not conform to Post_Factory
    it("should revert when Post_Factory address is not Post_Factory", async () => {
      // register the Feed contract as an invalid factory
      await this.PostRegistry.from(creator).addFactory(
        this.TestFeed.contractAddress,
        "0x"
      );

      await assert.revert(
        this.TestFeed.from(creator).createPost(
          this.TestFeed.contractAddress,
          createPostCallData
        )
      );
    });

    // malformed post init data
    it("should revert with malformed post init data", async () => {
      const callData = abiEncodeWithSelector(
        'initialize',
        ["bytes", "bytes"], // missing 1 bytes parameter
        [proofHash, postStaticMetadata]
      );

      await assert.revert(
        this.TestFeed.from(creator).createPost(
          this.PostFactory.contractAddress,
          callData
        )
      );
    });

    // factory must not be retired
    it("should revert when factory is retired", async () => {
      await this.PostRegistry.retireFactory(this.PostFactory.contractAddress);

      await assert.revertWith(
        this.TestFeed.from(creator).createPost(
          this.PostFactory.contractAddress,
          "0x"
        ),
        "factory is not actively registered"
      );
    });
  });

  describe("Feed.setMetadata", () => {
    it("should revert when msg.sender not operator or creator", async () => {
      await assert.revertWith(
        this.TestFeed.from(other).setMetadata(
          newFeedVariableMetadata
        ),
        "only active operator or creator"
      );
    });

    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(operator).setMetadata(
          newFeedVariableMetadata
        ),
        "only active operator or creator"
      );

      await this.TestFeed.activateOperator();
    });

    it("should set feed metadata from operator when active", async () => {
      const txn = await this.TestFeed.from(operator).setMetadata(
        newFeedVariableMetadata
      );
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(txn, [newFeedVariableMetadata]);
    });

    it("should set feed variable metadata from creator", async () => {
      const txn = await this.TestFeed.from(creator).setMetadata(
        newFeedVariableMetadata
      );
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(txn, [newFeedVariableMetadata]);
    });
  });

  describe("Feed.getPosts", () => {
    it("should get posts", async () => {
      const actualPosts = await this.TestFeed.getPosts();
      assert.deepEqual(actualPosts, posts);
    });
  });
});
