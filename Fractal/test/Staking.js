const etherlime = require("etherlime-lib");

describe("Staking", () => {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    Staking: {
      artifact: require("../build/Staking.json")
    },
    TestStaking: {
      artifact: require("../build/TestStaking.json")
    },
    MockNMR: {
      artifact: require("../build/MockNMR.json")
    }
  };

  let deployer;
  before(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(
      wallets.numerai.secretKey
    );
    contracts.Staking.instance = await deployer.deploy(
      contracts.Staking.artifact
    );
    contracts.TestStaking.instance = await deployer.deploy(
      contracts.TestStaking.artifact
    );
    contracts.MockNMR.instance = await deployer.deploy(
      contracts.MockNMR.artifact
    );
  });

  describe("Staking._setToken", () => {
    it("should setToken successfully", async () => {
      const tokenAddress = contracts.MockNMR.instance.contractAddress;

      await contracts.TestStaking.instance.setToken(tokenAddress);
    });
  });
});
