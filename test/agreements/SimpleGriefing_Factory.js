// require artifacts
const SimpleGriefing_FactoryArtifact = require("../../build/SimpleGriefing_Factory.json");
const MockNMRArtifact = require("../../build/MockNMR.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const testFactory = require("../modules/Factory");
const { RATIO_TYPES } = require("../helpers/variables");

// variables used in initialize()
const factoryName = "SimpleGriefing_Factory";
const instanceType = "Agreement";
const ratio = ethers.utils.parseEther("2");
const ratioType = RATIO_TYPES.Dec;
const countdownLength = 1000;
const staticMetadata = "TESTING";
const abiEncoder = new ethers.utils.AbiCoder();
const stakeData = abiEncoder.encode(["uint256", "uint8"], [ratio, ratioType]);

const createTypes = [
  "address",
  "address",
  "address",
  "address",
  "bytes",
  "bytes",
  "bytes"
];

let MockNMR;

before(async () => {
  MockNMR = await deployer.deploy(MockNMRArtifact);
});

function runFactoryTest() {
  const deployer = createDeployer();

  const [ownerWallet, stakerWallet, counterpartyWallet] = accounts;
  const owner = ownerWallet.signer.signingKey.address;
  const staker = stakerWallet.signer.signingKey.address;
  const counterparty = counterpartyWallet.signer.signingKey.address;

  describe(factoryName, () => {
    it("setups test", () => {
      const createArgs = [
        MockNMR.contractAddress,
        owner,
        staker,
        counterparty,
        stakeData,
        stakeData,
        Buffer.from(staticMetadata)
      ];

      testFactory(
        deployer,
        factoryName,
        instanceType,
        createTypes,
        createArgs,
        SimpleGriefing_FactoryArtifact,
        ErasureAgreementsRegistryArtifact,
        ErasurePostsRegistryArtifact
      );
    });
  });
}

runFactoryTest();
