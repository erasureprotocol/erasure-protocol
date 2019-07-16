const etherlime = require('etherlime-lib')

describe('Example', () => {

    let wallets = {
        numerai: accounts[0],
        seller: accounts[1],
        buyer: accounts[2],
    }

    for ([name, wallet] in wallets) {
        console.log(wallet);
        console.log(`${name} wallet at ${wallet.address}`)
    }

    let contracts = {
		Erasure_Agreements: {artifact: require('../build/Erasure_Agreements.json')},
		Erasure_Posts: {artifact: require('../build/Erasure_Posts.json')},
		Erasure_Escrows: {artifact: require('../build/Erasure_Escrows.json')},
		Erasure_Users: {artifact: require('../build/Erasure_Users.json')},
		ErasureScan: {artifact: require('../build/ErasureScan.json')},
        MockNMR: {artifact: require('../build/MockNMR.json')},
	}

    let deployer
    before(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(wallets.numerai.secretKey)
    })

    it('should deploy core contracts', async () => {
        contracts.MockNMR.instance = await deployer.deploy(contracts.MockNMR.artifact)
        contracts.MockNMR.address = contracts.MockNMR.instance.contractAddress

    	contracts.Erasure_Agreements.instance = await deployer.deploy(contracts.Erasure_Agreements.artifact, false, contracts.MockNMR.address)
    	contracts.Erasure_Escrows.instance = await deployer.deploy(contracts.Erasure_Escrows.artifact)
    	contracts.Erasure_Posts.instance = await deployer.deploy(contracts.Erasure_Posts.artifact, false, contracts.MockNMR.address)
    	contracts.Erasure_Users.instance = await deployer.deploy(contracts.Erasure_Users.artifact)

        contracts.Erasure_Agreements.address = contracts.Erasure_Agreements.instance.contractAddress
        contracts.Erasure_Escrows.address = contracts.Erasure_Escrows.instance.contractAddress
        contracts.Erasure_Posts.address = contracts.Erasure_Posts.instance.contractAddress
        contracts.Erasure_Users.address = contracts.Erasure_Users.instance.contractAddress
    })

    describe('ErasreScan flows with helper contract', () => {

        it('should deploy ErasureScan', async () => {
            contracts.ErasureScan.instance = await deployer.deploy(contracts.ErasureScan.artifact, false, contracts.MockNMR.address, contracts.Erasure_Agreements.address, contracts.Erasure_Escrows.address, contracts.Erasure_Posts.address)
            contracts.ErasureScan.address = contracts.ErasureScan.instance.contractAddress
        })

        it('should execute request flow', async () => {

            // buyer create request post
            // --> can delete anytime

            /*
            - create post
            - lock up price + stake in post
            */

            // seller submit data and puts stake in escrow
            // --> cancel after deadline

            /*
            - create post
            - create agreement with requester as only buyer
            - lock up stake in escrow
            */

            // buyer accepts agreement and puts price + stake in escrow
            // --> cancel after deadline

            /*
            - remove price + stake from post (and delete post)
            - transfer price to escrow
            - transfer stake to escrow
            - sign agreement
            */

            // seller submits data

            /*
            - close escrows: seller stake, buyer stake, price
            - transfer price to seller
            - transfer stakes to agreement
            - begin griefing period
            */

            // griefing

            // ending agreement
            // --> redeem stake after deadline

        })

        it('should execute submission flow', async () => {

            // seller submit data and puts stake in escrow
            // --> cancel after deadline

            /*
            - create post
            - create agreement open to any buyer
            - lock up stake in escrow
            */

            // buyer accepts agreement and puts price + stake in escrow
            // --> cancel after deadline

            /*
            - remove price + stake from post (and delete post)
            - transfer price to escrow
            - transfer stake to escrow
            - sign agreement
            */

            // seller submits data

            /*
            - close escrows: seller stake, buyer stake, price
            - transfer price to seller
            - transfer stakes to agreement
            - begin griefing period
            */

            // griefing

            // ending agreement
            // --> redeem stake after deadline

        })

        it('should execute revealed data flow', async () => {

            // seller creates post
            // --> can delete anytime

            /*
            - create post
            - lock up price + stake in post
            */

        })

    })

    describe('ErasreScan flows without helper contract', () => {

        it('should execute request flow', async () => {

            // buyer create request post
            // --> can delete anytime

            /*
            - create post
            - lock up price + stake in post
            */

            // seller submit data and puts stake in escrow
            // --> cancel after deadline

            /*
            - create post
            - create agreement with requester as only buyer
            - lock up stake in escrow
            */

            // buyer accepts agreement and puts price + stake in escrow
            // --> cancel after deadline

            /*
            - remove price + stake from post (and delete post)
            - transfer price to escrow
            - transfer stake to escrow
            - sign agreement
            */

            // seller submits data

            /*
            - close escrows: seller stake, buyer stake, price
            - transfer price to seller
            - transfer stakes to agreement
            - begin griefing period
            */

            // griefing

            // ending agreement
            // --> redeem stake after deadline

        })

        it('should execute submission flow', async () => {

            // seller submit data and puts stake in escrow
            // --> cancel after deadline

            /*
            - create post
            - create agreement open to any buyer
            - lock up stake in escrow
            */

            // buyer accepts agreement and puts price + stake in escrow
            // --> cancel after deadline

            /*
            - remove price + stake from post (and delete post)
            - transfer price to escrow
            - transfer stake to escrow
            - sign agreement
            */

            // seller submits data

            /*
            - close escrows: seller stake, buyer stake, price
            - transfer price to seller
            - transfer stakes to agreement
            - begin griefing period
            */

            // griefing

            // ending agreement
            // --> redeem stake after deadline

        })

        it('should execute revealed data flow', async () => {

            // seller creates post
            // --> can delete anytime

            /*
            - create post
            - lock up price + stake in post
            */

        })

    })
})
