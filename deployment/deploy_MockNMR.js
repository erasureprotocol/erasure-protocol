const etherlime = require('etherlime-lib')
const ethers = require('ethers')
require('dotenv').config()

const deploy = async (network, secret) => {
  let contracts = {
    MockNMR: { artifact: require('../build/MockNMR.json') },
  }

  let deployer
  let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY)
  console.log(`Deployment Wallet: ${wallet.address}`)
  console.log(`Deployment Network: ${network}`)

  deployer = await new etherlime.InfuraPrivateKeyDeployer(
    wallet.privateKey,
    'rinkeby',
    process.env.INFURA_API_KEY,
  )
  deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY)

  contracts.MockNMR.instance = await deployer.deployAndVerify(
    contracts.MockNMR.artifact,
  )
}

module.exports = {
  deploy,
}
