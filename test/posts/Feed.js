const { createDeployer } = require("../helpers/setup");
const {
  hexlify,
  createInstanceAddress,
  createInstanceAddressWithInitData,
  createSelector,
  createMultihashSha256
} = require("../helpers/utils");
const FeedArtifact = require("../../build/Feed.json");
const TestFeedArtifact = require("../../build/TestFeed.json");
const PostFactoryArtifact = require("../../build/Post_Factory.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

describe("Feed", function() {
  this.timeout(4000);

  let deployer;

  // wallets and addresses
  const [ownerWallet, posterWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const poster = posterWallet.signer.signingKey.address;

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
  const abiEncoder = new ethers.utils.AbiCoder();
  const createPostABITypes = ["bytes", "bytes", "bytes"];
  const createPostABIValues = [
    proofHash,
    postStaticMetadata,
    postVariableMetadata
  ];
  const createPostCallData = abiEncoder.encode(
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

  const deployTestFeed = async (validInit = true) => {
    const contract = await deployer.deploy(
      TestFeedArtifact,
      false,
      this.Feed.contractAddress,
      validInit,
      owner,
      this.PostRegistry.contractAddress,
      feedStaticMetadata
    );
    return contract;
  };

  before(async () => {
    deployer = await createDeployer();

    this.Feed = await deployer.deploy(FeedArtifact);
    this.PostRegistry = await deployer.deploy(ErasurePostsArtifact);
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

      // getPostRegistry
      const actualPostRegistry = await this.TestFeed.getPostRegistry();
      assert.equal(actualPostRegistry, this.PostRegistry.contractAddress);

      // Operator._setOperator
      const operator = await this.TestFeed.getOperator();
      assert.equal(operator, owner);

      //  Operator._activate()
      const operatorIsActive = await this.TestFeed.isActive();
      assert.equal(operatorIsActive, true);

      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestFeed.getMetadata();
      assert.equal(actualStaticMetadata, feedStaticMetadata);
      assert.equal(actualVariableMetadata, "0x");
    });

    it("should revert when initialize from function", async () => {
      await assert.revertWith(
        this.TestFeed.initializeFeed(
          owner,
          this.PostRegistry.contractAddress,
          feedStaticMetadata
        ),
        "must be called within contract constructor"
      );
    });
  });

  describe("Feed.createPost", () => {
    // check operator access control
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestFeed.from(poster).createPost(
          this.PostFactory.contractAddress,
          "0x"
        ),
        "only active operator"
      );
    });

    // check deactivated operator
    it("should revert when msg.sender is not active operator", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(poster).createPost(
          this.PostFactory.contractAddress,
          "0x"
        ),
        "only active operator"
      );

      await this.TestFeed.activateOperator();
    });

    // post registry address does not conform to iregistry
    it("should revert when postRegistry is not registry", async () => {
      this.TestFeed = await deployer.deploy(
        TestFeedArtifact,
        false,
        this.Feed.contractAddress,
        true,
        owner,
        this.PostFactory.contractAddress, // pass in Factory instead of Registry
        feedStaticMetadata
      );

      await assert.revert(
        this.TestFeed.from(owner).createPost(
          this.PostFactory.contractAddress,
          "0x"
        )
      );

      // redeploy a valid TestFeed again
      this.TestFeed = await deployTestFeed();
    });

    // factory must be registered
    it("should revert when factory not registered", async () => {
      await assert.revertWith(
        this.TestFeed.from(owner).createPost(
          this.PostFactory.contractAddress,
          "0x"
        ),
        "factory is not actively registered"
      );
    });

    // success case
    it("should create post successfully", async () => {
      await this.PostRegistry.from(owner).addFactory(
        this.PostFactory.contractAddress,
        "0x"
      );

      const txn = await this.TestFeed.from(owner).createPost(
        this.PostFactory.contractAddress,
        createPostCallData
      );

      const receipt = await this.TestFeed.verboseWaitForTransaction(txn);

      const postTemplate = await this.PostFactory.getTemplate();
      const selector = createSelector(
        "initialize",
        ["address", "bytes", "bytes", "bytes"]
      );

      const initData = abiEncoder.encode(
        ["address", "bytes", "bytes", "bytes"],
        [
          this.TestFeed.contractAddress,
          proofHash,
          postStaticMetadata,
          postVariableMetadata
        ]
      );

      const {
        instanceAddress: postAddress
      } = createInstanceAddressWithInitData(
        this.PostFactory.contractAddress,
        postTemplate,
        this.TestFeed.contractAddress,
        selector,
        initData,
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
      assert.equal(postCreatedEvent.args.initData, createPostCallData);
      assert.equal(postCreatedEvent.args.post, postAddress);
      assert.equal(
        postCreatedEvent.args.postFactory,
        this.PostFactory.contractAddress
      );
    });

    // post factory does not conform to Post_Factory
    it("should revert when Post_Factory address is not Post_Factory", async () => {
      // register the Feed contract as an invalid factory
      await this.PostRegistry.from(owner).addFactory(
        this.Feed.contractAddress,
        "0x"
      );

      await assert.revert(
        this.TestFeed.from(owner).createPost(
          this.Feed.contractAddress,
          createPostCallData
        )
      );
    });

    // malformed post init data
    it("should revert with malformed post init data", async () => {
      const initData = abiEncoder.encode(
        ["bytes", "bytes"], // missing 1 bytes parameter
        [proofHash, postStaticMetadata]
      );

      await assert.revert(
        this.TestFeed.from(owner).createPost(
          this.Feed.contractAddress,
          initData
        )
      );
    });

    // factory must not be retired
    it("should revert when factory is retired", async () => {
      await this.PostRegistry.retireFactory(this.PostFactory.contractAddress);

      await assert.revertWith(
        this.TestFeed.from(owner).createPost(
          this.PostFactory.contractAddress,
          "0x"
        ),
        "factory is not actively registered"
      );
    });
  });

  describe("Feed.setFeedVariableMetadata", () => {
    it("should revert when msg.sender not operator", async () => {
      await assert.revertWith(
        this.TestFeed.from(poster).setFeedVariableMetadata(
          newFeedVariableMetadata
        ),
        "only active operator"
      );
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(owner).setFeedVariableMetadata(
          newFeedVariableMetadata
        ),
        "only active operator"
      );

      await this.TestFeed.activateOperator();
    });

    it("should set feed variable metadata", async () => {
      const txn = await this.TestFeed.from(owner).setFeedVariableMetadata(
        newFeedVariableMetadata
      );
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(txn, [newFeedVariableMetadata]);

      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestFeed.getMetadata();
      assert.equal(actualStaticMetadata, feedStaticMetadata);
      assert.equal(actualVariableMetadata, newFeedVariableMetadata);
    });
  });

  describe("Feed.getPosts", () => {
    it("should get posts", async () => {
      const actualPosts = await this.TestFeed.getPosts();
      assert.deepEqual(actualPosts, posts);
    });
  });
});
