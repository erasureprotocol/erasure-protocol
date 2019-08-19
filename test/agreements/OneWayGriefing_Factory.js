// require artifacts
const OneWayGriefing_FactoryArtifact = require("../../build/OneWayGriefing_Factory.json");
const MockNMRArtifact = require("../../build/MockNMR.json");
const ErasureAgreementsRegistryArtifact = require("../../build/Erasure_Agreements.json");
const ErasurePostsRegistryArtifact = require("../../build/Erasure_Posts.json");

// test helpers
const { createDeployer } = require("../helpers/setup");
const testFactory = require("../modules/Factory");
const { RATIO_TYPES } = require("../helpers/variables");

// variables used in initialize()
const factoryName = "OneWayGriefing_Factory";
const instanceType = "Agreement";
const ratio = ethers.utils.parseEther("2");
const ratioType = RATIO_TYPES.Dec;
const countdownLength = 1000;
const staticMetadata = "TESTING";

const createTypes = [
  "address",
  "address",
  "address",
  "address",
  "uint256",
  "uint8",
  "uint256",
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
        ratio,
        ratioType,
        countdownLength,
        Buffer.from(staticMetadata)
      ];

      testFactory(
        deployer,
        "OneWayGriefing_Factory",
        instanceType,
        createTypes,
        createArgs,
        OneWayGriefing_FactoryArtifact,
        ErasureAgreementsRegistryArtifact,
        ErasurePostsRegistryArtifact
      );
    });
  });
}

runFactoryTest();
