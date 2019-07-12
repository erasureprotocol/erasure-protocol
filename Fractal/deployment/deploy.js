const etherlime = require('etherlime-lib');
const ethers = require('ethers')
require('dotenv').config()


const deploy = async (network, secret) => {

	let contracts = {
		Agreements: {artifact: require('../build/Agreements.json')},
		Posts: {artifact: require('../build/Posts.json')},
		Escrow: {artifact: require('../build/Escrow.json')},
		UserMetadata: {artifact: require('../build/UserMetadata.json')},
		SignedAgreement: {artifact: require('../build/SignedAgreement.json')},
		Advertising: {artifact: require('../build/Advertising.json')}
	}

	let deployer
	let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY)
	console.log(`Deployment Wallet: ${wallet.address}`)

	if (network == 'rinkeby') {

		deployer = await new etherlime.InfuraPrivateKeyDeployer(wallet.privateKey, 'rinkeby', process.env.INFURA_API_KEY)
		deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY)

		let tokenAddress = '0xb6954ecf843d3f445aa918c8614e871c2cbcfd2c'

		contracts.Agreements.instance = await deployer.deployAndVerify(contracts.Agreements.artifact, false, tokenAddress)
		contracts.Escrow.instance = await deployer.deployAndVerify(contracts.Escrow.artifact)
		contracts.Posts.instance = await deployer.deployAndVerify(contracts.Posts.artifact, false, tokenAddress)

		contracts.UserMetadata.instance = await deployer.deployAndVerify(contracts.UserMetadata.artifact)
		contracts.SignedAgreement.instance = await deployer.deployAndVerify(contracts.SignedAgreement.artifact, false, tokenAddress, contracts.Agreements.instance.contractAddress, contracts.Escrow.instance.contractAddress)
		contracts.Advertising.instance = await deployer.deployAndVerify(contracts.Advertising.artifact, false, tokenAddress, contracts.Posts.instance.contractAddress)

	} else if (network == 'local') {
		deployer = new etherlime.EtherlimeGanacheDeployer()
	}

}

module.exports = {
	deploy
}
