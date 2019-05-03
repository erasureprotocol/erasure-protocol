const etherlime = require('etherlime');
const ErasureNext = require('../build/ErasureNext.json');


const deploy = async (network, secret) => {

	let deployer;
	
	if (network == 'local') {
		deployer = new etherlime.EtherlimeGanacheDeployer();
	}
	const result = await deployer.deploy(ErasureNext);

};

module.exports = {
	deploy
};
