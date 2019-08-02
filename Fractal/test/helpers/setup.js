const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const ganache = require("ganache-cli");

function createDeployer() {
  const defaultAccounts = accounts.map(account => {
    return {
      // give each account 100 ETH
      balance: ethers.utils.parseEther("100").toString(10),
      secretKey: account.secretKey
    };
  });

  const provider = new ethers.providers.Web3Provider(
    ganache.provider({ accounts: defaultAccounts })
  );
  deployer = new etherlime.EtherlimeGanacheDeployer(accounts[0].secretKey);
  deployer.setProvider(provider);

  return deployer;
}

module.exports = {
  createDeployer
};
