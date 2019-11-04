const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`...`);
var $ = require("jquery")(window);

const BigNumber = require('bignumber.js');

require("dotenv").config();
const infura_token = process.env.INFURA_API_KEY;
const etherscan_token = process.env.ETHERSCAN_API_KEY;

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${infura_token}`));

async function main() {

    const NMR_Address = "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671";
    const Erasure_Address = "0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF";

    let NMR = await getContract(NMR_Address);
    let Erasure = await getContract(Erasure_Address);

    let agreementCount = await Erasure.methods.getInstanceCount().call();
    let agreements = await Erasure.methods.getInstances().call();

    const tournamentAddress = "0x9DCe896DdC20BA883600176678cbEe2B8BA188A9";
    agreements.push(tournamentAddress);

    let sumStake = new BigNumber(0);
    for (const agreement of agreements) {
        let stake = await NMR.methods.balanceOf(agreement).call();
        sumStake = sumStake.plus(BigNumber(stake));
    }

    const numeraiTreasury = [
        "0xdc6997b078C709327649443D0765BCAa8e37aA6C",
        "0x0000000000377D181A0ebd08590c6B399b272000",
        "0x7a95eEDAfEc782230aF701B0ba0b42d8Eb5490F0"
    ];

    let sumTreasury = BigNumber(0);
    for (const wallet of numeraiTreasury) {
        let balance = await NMR.methods.balanceOf(wallet).call();
        sumTreasury = sumTreasury.plus(BigNumber(balance));
    }

    let totalSupply = await NMR.methods.totalSupply().call();
    let circulatingSupply = BigNumber(totalSupply).minus(sumTreasury);

    console.log(`
    total_supply:               ${BigNumber(totalSupply).div(10 ** 18).toFixed()}
    circulating_supply:         ${BigNumber(circulatingSupply).div(10 ** 18).toFixed()}
    current_stake_amount:       ${sumStake.div(10 ** 18).toFixed()}
    historical_agreement_count: ${agreementCount}
    `);

}

async function getContract(contractAddress) {
    var data = await $.getJSON(`https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscan_token}`);
    var contractABI = JSON.parse(data.result);
    return new web3.eth.Contract(contractABI, contractAddress);
}

main();