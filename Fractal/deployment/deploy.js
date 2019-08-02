const etherlime = require('etherlime-lib');
const ethers = require('ethers')
require('dotenv').config()

const tokenAddress = '0x1eBf22785bffb6B44fEbBc8a41056b1aD43401f9'

const deploy = async (network, secret) => {

	let contracts = {
		Erasure_Agreements: {artifact: require('../build/Erasure_Agreements.json')},
		Erasure_Escrows: {artifact: require('../build/Erasure_Escrows.json')},
		Erasure_Feeds: {artifact: require('../build/Erasure_Feeds.json')},
		Erasure_Posts: {artifact: require('../build/Erasure_Posts.json')},
		Erasure_Users: {artifact: require('../build/Erasure_Users.json')},
		OneWayGriefing_Factory: {artifact: require('../build/OneWayGriefing_Factory.json')},
		Feed_Factory: {artifact: require('../build/Feed_Factory.json')},
		Post_Factory: {artifact: require('../build/Post_Factory.json')}
	}

	let deployer
	let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY)
	console.log(`Deployment Wallet: ${wallet.address}`)

	if (network == 'rinkeby') {

		deployer = await new etherlime.InfuraPrivateKeyDeployer(wallet.privateKey, 'rinkeby', process.env.INFURA_API_KEY)
		deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY)

		contracts.Erasure_Agreements.instance = await deployer.deployAndVerify(contracts.Erasure_Agreements.artifact, false)
		contracts.Erasure_Escrows.instance = await deployer.deployAndVerify(contracts.Erasure_Escrows.artifact, false)
		contracts.Erasure_Feeds.instance = await deployer.deployAndVerify(contracts.Erasure_Feeds.artifact, false)
		contracts.Erasure_Posts.instance = await deployer.deployAndVerify(contracts.Erasure_Posts.artifact, false)
		contracts.Erasure_Users.instance = await deployer.deployAndVerify(contracts.Erasure_Users.artifact, false)

		contracts.OneWayGriefing_Factory.instance = await deployer.deployAndVerify(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress)
		contracts.Feed_Factory.instance = await deployer.deployAndVerify(contracts.Feed_Factory.artifact, false, contracts.Erasure_Feeds.instance.contractAddress)
		contracts.Post_Factory.instance = await deployer.deployAndVerify(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress)

	} else if (network == 'local') {
		deployer = new etherlime.EtherlimeGanacheDeployer()
	}

}

module.exports = {
	deploy
}
