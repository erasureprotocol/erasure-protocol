const { createDeployer } = require("../helpers/setup");
const { hexlify, createMultihashSha256 } = require("../helpers/utils");
const PostArtifact = require("../../build/Post.json");
const TestPostArtifact = require("../../build/TestPost.json");

describe("Post", () => {
  let deployer;

  // wallets and addresses
  const [ownerWallet, posterWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const poster = posterWallet.signer.signingKey.address;

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

  const deployTestPost = async (validInit = true) => {
    const contract = await deployer.deploy(
      TestPostArtifact,
      false,
      this.Post.contractAddress,
      validInit,
      owner,
      proofHash,
      staticMetadata,
      variableMetadata
    );
    return contract;
  };

  before(async () => {
    deployer = await createDeployer();

    this.Post = await deployer.deploy(PostArtifact);
  });

  describe("Post.initialize", () => {
    it("should revert when invalid proofHash", async () => {
      await assert.revert(
        deployer.deploy(
          TestPostArtifact,
          false,
          this.Post.contractAddress,
          true,
          owner,
          Buffer.from(invalidProofHash),
          staticMetadata,
          variableMetadata
        )
      );
    });

    it("should revert when initialize with malformed init data", async () => {
      await assert.revert(deployTestPost(false));
    });

    it("should initialize post", async () => {
      this.TestPost = await deployTestPost(true);

      // // ProofHash._setProofHash
      const actualProofHash = await this.TestPost.getProofHash();
      assert.equal(actualProofHash, proofHash);

      // Operator._setOperator
      const operator = await this.TestPost.getOperator();
      assert.equal(operator, owner);

      //  Operator._activate()
      const operatorIsActive = await this.TestPost.isActive();
      assert.equal(operatorIsActive, true);

      const [
        actualStaticMetadata,
        actualVariableMetadata
      ] = await this.TestPost.getMetadata();
      assert.equal(actualStaticMetadata, staticMetadata);
      assert.equal(actualVariableMetadata, variableMetadata);
    });

    it("should revert when initialize from function", async () => {
      await assert.revertWith(
        this.TestPost.initializePost(
          owner,
          proofHash,
          staticMetadata,
          variableMetadata
        ),
        "must be called within contract constructor"
      );
    });
  });

  describe("Post.setVariableMetadata", () => {
    it("should revert when msg.sender is not operator", async () => {
      await assert.revertWith(
        this.TestPost.from(poster).setVariableMetadata(newVariableMetadata),
        "only active operator"
      );
    });

    it("should set variable metadata", async () => {
      const txn = await this.TestPost.from(owner).setVariableMetadata(
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
        this.TestPost.from(owner).setVariableMetadata(newVariableMetadata),
        "only active operator"
      );
    });
  });
});
