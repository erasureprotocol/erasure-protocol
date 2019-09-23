// require artifacts
const PostFactoryArtifact = require("../../build/Post_Factory.json");
const PostArtifact = require("../../build/Post.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const { createMultihashSha256 } = require("../helpers/utils");
const testFactory = require("../modules/Factory");

const [, , creatorWallet] = accounts;
const creator = creatorWallet.signer.signingKey.address;

// variables used in initialize()
const factoryName = "Post_Factory";
const instanceType = "Post";
const proofHash = createMultihashSha256("proofHash");
const staticMetadata = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("staticMetadata")
);
const variableMetadata = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("variableMetadata")
);

const createTypes = ["address", "bytes", "bytes"];
const createArgs = [creator, proofHash, staticMetadata];

let PostTemplate;
let deployer;

before(async () => {
  deployer = createDeployer();
  PostTemplate = await deployer.deploy(PostArtifact);
});

function runFactoryTest() {
  // const deployer = createDeployer();

  describe(factoryName, () => {
    it("setups test", () => {
      testFactory(
        deployer,
        factoryName,
        instanceType,
        createTypes,
        createArgs,
        PostFactoryArtifact,
        ErasurePostsRegistryArtifact,
        ErasureAgreementsRegistryArtifact,
        [PostTemplate.contractAddress]
      );
    });
  });
}

runFactoryTest();
