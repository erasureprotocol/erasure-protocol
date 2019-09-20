const etherlime = require("etherlime-lib");

const { createDeployer } = require("../helpers/setup");
const {
  hexlify,
  createMultihashSha256,
  abiEncodeWithSelector,
  assertEvent
} = require("../helpers/utils");

// artifacts
const TestFeedArtifact = require("../../build/TestFeed.json");
const FeedFactoryArtifact = require("../../build/Feed_Factory.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

describe("Feed", function () {

  let deployer;

  // wallets and addresses
  const [creatorWallet, otherWallet, operatorWallet] = accounts;
  const creator = creatorWallet.signer.signingKey.address;
  const other = otherWallet.signer.signingKey.address;
  const operator = operatorWallet.signer.signingKey.address;

  // local Post array
  let posts = [];
  const addPost = (proofHash, metadata) => {
    const postID = posts.push({ proofHash, metadata }) - 1;
    return postID;
  };

  // post variables
  const feedMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("feedMetadata")
  );
  const newFeedMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("newFeedMetadata")
  );
  const proofHash = createMultihashSha256("proofHash");
  const hash =  ethers.utils.keccak256(hexlify("proofHash"));
  const invalidProofHash = ethers.utils.keccak256(hexlify("invalidProofHash"));
  const postMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("postMetadata")
  );

  const deployTestFeed = async (
    validInit = true,
    args = [operator, proofHash, feedMetadata]
  ) => {
    let callData;

    if (validInit) {
      callData = abiEncodeWithSelector(
        "initialize",
        ["address", "bytes", "bytes"],
        args
      );
      const postID = addPost(proofHash);
    } else {
      // invalid callData is missing first address
      callData = abiEncodeWithSelector("initialize", ["bytes"], [feedMetadata]);
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

    this.FeedTemplate = await deployer.deploy(TestFeedArtifact);

    this.FeedFactory = await deployer.deploy(
      FeedFactoryArtifact,
      false,
      this.PostRegistry.contractAddress,
      this.FeedTemplate.contractAddress
    );

    await this.PostRegistry.from(deployer.signer).addFactory(
      this.FeedFactory.contractAddress,
      "0x"
    );
  });

  describe("Feed.initialize", () => {
    it("should revert when initialize with malformed init data", async () => {
      await assert.revert(deployTestFeed(false));
    });

    it("should initialize feed", async () => {
      this.TestFeed = await deployTestFeed(true);

      // Operator._setOperator
      const actualOperator = await this.TestFeed.getOperator();
      assert.equal(actualOperator, operator);

      //  Operator._activateOperator()
      const operatorIsActive = await this.TestFeed.hasActiveOperator();
      assert.equal(operatorIsActive, true);
    });
  });

  describe("Feed.submitHash", () => {
    // check operator access control
    it("should revert when msg.sender is not operator or creator", async () => {
      // Factory has to be the sender here
      await assert.revertWith(
        this.TestFeed.from(other).submitHash(hash),
        "only active operator or creator"
      );
    });

    // check deactivated operator
    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(operator).submitHash(hash),
        "only active operator or creator"
      );

      await this.TestFeed.activateOperator();
    });

    // success case
    it("should submit hash successfully from creator", async () => {
      const hash =  ethers.utils.keccak256(hexlify("proofHash1"));
      const postID = addPost(hash);

      const txn = await this.TestFeed.from(creator).submitHash(hash);
      assertEvent(this.TestFeed, txn, "HashSubmitted", [hash]);
    });

    it("should submit hash successfully from operator", async () => {
      const hash =  ethers.utils.keccak256(hexlify("proofHash2"));
      const postID = addPost(hash);

      const txn = await this.TestFeed.from(operator).submitHash(hash);
      assertEvent(this.TestFeed, txn, "HashSubmitted", [hash]);
    });
  });

  describe("Feed.setMetadata", () => {
    it("should revert when msg.sender not operator or creator", async () => {
      await assert.revertWith(
        this.TestFeed.from(other).setMetadata(newFeedMetadata),
        "only active operator or creator"
      );
    });

    it("should revert when msg.sender is operator but not active", async () => {
      await this.TestFeed.deactivateOperator();

      await assert.revertWith(
        this.TestFeed.from(operator).setMetadata(newFeedMetadata),
        "only active operator or creator"
      );

      await this.TestFeed.activateOperator();
    });

    it("should set feed metadata from operator when active", async () => {
      const txn = await this.TestFeed.from(operator).setMetadata(
        newFeedMetadata
      );
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(txn, [newFeedMetadata]);
    });

    it("should set feed metadata from creator", async () => {
      const txn = await this.TestFeed.from(creator).setMetadata(
        newFeedMetadata
      );
      await assert.emit(txn, "MetadataSet");
      await assert.emitWithArgs(txn, [newFeedMetadata]);
    });
  });
});
