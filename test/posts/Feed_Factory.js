// require artifacts
const FeedFactoryArtifact = require("../../build/Feed_Factory.json");
const ErasureFeedsArtifact = require("../../build/Erasure_Feeds.json");
const ErasurePostsArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const testFactory = require("../modules/Factory");

const [, , posterWallet] = accounts;
const poster = posterWallet.signer.signingKey.address;

// variables used in initialize()
const factoryName = "Feed_Factory";
const instanceType = "Feed";
const staticMetadata = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("staticMetadata")
);

const createTypes = ["address", "bytes"];
const createInstanceTypes = ["address", "address", "bytes"];

const initDataABI = "(address,bytes)";
const callDataABI = "(bytes4,address,address,bytes)";

let PostRegistry;

before(async () => {
  PostRegistry = await deployer.deploy(ErasurePostsArtifact);
});

function runFactoryTest() {
  const deployer = createDeployer();

  describe(factoryName, () => {
    it("setups test", () => {
      const createArgs = [PostRegistry.contractAddress, staticMetadata];
      const createInstanceArgs = [poster, ...createArgs];

      testFactory(
        deployer,
        factoryName,
        instanceType,
        initDataABI,
        callDataABI,
        createTypes,
        createArgs,
        FeedFactoryArtifact,
        ErasureFeedsArtifact,
        ErasurePostsArtifact,
        createInstanceTypes,
        createInstanceArgs
      );
    });
  });
}

runFactoryTest();
