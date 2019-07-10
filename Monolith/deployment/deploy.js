const etherlime = require('etherlime-lib');
const ethers = require('ethers')
require('dotenv').config()


const deploy = async (network, secret) => {

	let contracts = {
		ErasureNext_Agreements: {artifact: require('../build/ErasureNext_Agreements.json')},
		ErasureNext_Posts: {artifact: require('../build/ErasureNext_Posts.json')},
		ErasureNext_Escrow: {artifact: require('../build/ErasureNext_Escrow.json')},
		ErasureNext_UserMetadata: {artifact: require('../build/ErasureNext_UserMetadata.json')},
		ErasureNext_SignedAgreement: {artifact: require('../build/ErasureNext_SignedAgreement.json')},
		ErasureNext_Ads: {artifact: require('../build/ErasureNext_Ads.json')}
	}

	let deployer
	let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY)
	console.log(`Deployment Wallet: ${wallet.address}`)

	if (network == 'rinkeby') {

		deployer = await new etherlime.InfuraPrivateKeyDeployer(wallet.privateKey, 'rinkeby', process.env.INFURA_API_KEY)
		deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY)

		let tokenAddress = '0xb6954ecf843d3f445aa918c8614e871c2cbcfd2c'

		contracts.ErasureNext_Agreements.instance = await deployer.deployAndVerify(contracts.ErasureNext_Agreements.artifact, false, tokenAddress)
		contracts.ErasureNext_Escrow.instance = await deployer.deployAndVerify(contracts.ErasureNext_Escrow.artifact)
		contracts.ErasureNext_Posts.instance = await deployer.deployAndVerify(contracts.ErasureNext_Posts.artifact, false, tokenAddress)

		contracts.ErasureNext_UserMetadata.instance = await deployer.deployAndVerify(contracts.ErasureNext_UserMetadata.artifact)
		contracts.ErasureNext_SignedAgreement.instance = await deployer.deployAndVerify(contracts.ErasureNext_SignedAgreement.artifact, false, tokenAddress, contracts.ErasureNext_Agreements.instance.contractAddress, contracts.ErasureNext_Escrow.instance.contractAddress)
		contracts.ErasureNext_Ads.instance = await deployer.deployAndVerify(contracts.ErasureNext_Ads.artifact, false, tokenAddress, contracts.ErasureNext_Posts.instance.contractAddress)

	} else if (network == 'local') {
		deployer = new etherlime.EtherlimeGanacheDeployer()
	}

}

module.exports = {
	deploy
}
