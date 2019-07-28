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
  });
});
