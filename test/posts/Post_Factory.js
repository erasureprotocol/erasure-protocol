// require artifacts
const PostFactoryArtifact = require("../../build/Post_Factory.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const { createMultihashSha256 } = require("../helpers/utils");
const testFactory = require("../modules/Factory");

const [, , posterWallet] = accounts;
const poster = posterWallet.signer.signingKey.address;

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

const createTypes = ["bytes", "bytes", "bytes"];
const createArgs = [proofHash, staticMetadata, variableMetadata];

const createInstanceTypes = ["address", ...createTypes];
const createInstanceArgs = [poster, ...createArgs];

const initDataABI = "(bytes,bytes,bytes)";
const callDataABI = "(bytes4,address,bytes,bytes,bytes)";

function runFactoryTest() {
  const deployer = createDeployer();

  describe(factoryName, () => {
    it("setups test", () => {
      testFactory(
        deployer,
        factoryName,
        instanceType,
        initDataABI,
        callDataABI,
        createTypes,
        createArgs,
        PostFactoryArtifact,
        ErasurePostsRegistryArtifact,
        ErasureAgreementsRegistryArtifact,
        createInstanceTypes,
        createInstanceArgs
      );
    });
  });
}

runFactoryTest();
