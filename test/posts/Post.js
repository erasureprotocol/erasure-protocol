const etherlime = require("etherlime-lib");
const { createDeployer } = require("../helpers/setup");
const {
  hexlify,
  createMultihashSha256,
  abiEncodeWithSelector
} = require("../helpers/utils");
const PostFactoryArtifact = require("../../build/Post_Factory.json");
const TestPostArtifact = require("../../build/TestPost.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

const abiEncoder = new ethers.utils.AbiCoder();

describe("Post", () => {
  let deployer;

  // wallets and addresses
  const [creatorWallet, otherWallet, operatorWallet] = accounts;
  const creator = creatorWallet.signer.signingKey.address;
  const other = otherWallet.signer.signingKey.address;
  const operator = operatorWallet.signer.signingKey.address;

  const proofHash = createMultihashSha256("proofHash");
  const invalidProofHash = ethers.utils.keccak256(hexlify("invalidProofHash"));
  const staticMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("staticMetadata")
  );
  const variableMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("variableMetadata")
  );
  const newVariableMetadata = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("newVariableMetadata")
  );

  const createPostAbiTypes = ["address", "bytes", "bytes", "bytes"];
  const createPostAbiValues = [
    operator,
    proofHash,
    staticMetadata,
    variableMetadata
  ];

  const deployTestPost = async (args = createPostAbiValues) => {
    const callData = abiEncodeWithSelector(
      "initialize",
      createPostAbiTypes,
      args
    );
    const txn = await this.PostFactory.from(creator).create(callData);

    const receipt = await this.PostFactory.verboseWaitForTransaction(txn);
    const expectedEvent = "InstanceCreated";
    const createFeedEvent = receipt.events.find(
      emittedEvent => emittedEvent.event === expectedEvent,
      "There is no such event"
    );
    // parse event logs to get new instance address
    // use new instance address to create contract object
    const postAddress = createFeedEvent.args.instance;

    const postContract = etherlime.ContractAt(
      TestPostArtifact,
      postAddress,
      creatorWallet.secretKey
    );

    return postContract;
  };

  before(async () => {
    deployer = await createDeployer();

    this.PostRegistry = await deployer.deploy(ErasurePostsArtifact);

    this.PostTemplate = await deployer.deploy(TestPostArtifact);

    this.PostFactory = await deployer.deploy(
      PostFactoryArtifact,
      false,
      this.PostRegistry.contractAddress,
      this.PostTemplate.contractAddress
    );

    await this.PostRegistry.from(creator).addFactory(
      this.PostFactory.contractAddress,
      "0x"
    );
  });

  describe("Post.initialize", () => {
    it("should revert when invalid proofHash", async () => {
      await assert.revert(
        deployTestPost([
          operator,
          invalidProofHash,
          staticMetadata,
          variableMetadata
        ])
      );
    });

    it("should initialize post", async () => {
      this.TestPost = await deployTestPost();

      // // ProofHash._setProofHash
      const actualProofHash = await this.TestPost.getProofHash();
      assert.equal(actualProofHash, proofHash);

      // Operator._setOperator
      const actualOperator = await this.TestPost.getOperator();
      assert.equal(actualOperator, operator);

      //  Operator._activate()
      const operatorIsActive = await this.TestPost.hasActiveOperator();
      assert.equal(operatorIsActive, true);

      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestPost.getMetadata();
      assert.equal(actualStaticMetadata, staticMetadata);
      assert.equal(actualVariableMetadata, variableMetadata);
    });
  });

  describe("Post.setVariableMetadata", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestPost.from(other).setVariableMetadata(newVariableMetadata),
        "only active operator or creator"
      );
    });

    it("should set variable metadata", async () => {
      const txn = await this.TestPost.from(operator).setVariableMetadata(
        newVariableMetadata
      );
      await assert.emit(txn, "VariableMetadataSet");
      await assert.emitWithArgs(txn, [newVariableMetadata]);

      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestPost.getMetadata();
      assert.equal(actualStaticMetadata, staticMetadata);
      assert.equal(actualVariableMetadata, newVariableMetadata);
    });

    it("should revert when msg.sender is not active operator", async () => {
      await this.TestPost.deactivateOperator();

      await assert.revertWith(
        this.TestPost.from(operator).setVariableMetadata(newVariableMetadata),
        "only active operator or creator"
      );
    });
  });
});
