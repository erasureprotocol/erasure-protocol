// require artifacts
const FeedFactoryArtifact = require("../../build/Feed_Factory.json");
const ErasureAgreementsArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const testFactory = require("../modules/Factory");
const [, , creatorWallet] = accounts;
const creator = creatorWallet.signer.signingKey.address;

// variables used in initialize()
const factoryName = "Feed_Factory";
const instanceType = "Post";
const staticMetadata = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("staticMetadata")
);

const createTypes = ["address", "address", "bytes"];
const initDataABI = "(address,address,bytes)";

let PostRegistry;

before(async () => {
  PostRegistry = await deployer.deploy(ErasurePostsArtifact);
});

function runFactoryTest() {
  const deployer = createDeployer();

  describe(factoryName, () => {
    it("setups test", () => {
      const createArgs = [
        creator,
        PostRegistry.contractAddress,
        staticMetadata
      ];

      testFactory(
        deployer,
        factoryName,
        instanceType,
        initDataABI,
        createTypes,
        createArgs,
        FeedFactoryArtifact,
        ErasurePostsArtifact, // correct registry
        ErasureAgreementsArtifact // wrong registry
      );
    });
  });
}

runFactoryTest();
