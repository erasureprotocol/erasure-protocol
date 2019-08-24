const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const { createMultihashSha256 } = require("../test/helpers/utils");
require("dotenv").config();

const deploy = async (network, secret) => {
  let contracts = {
    MockNMR: {artifact: require('../build/MockNMR.json')},
    Erasure_Agreements: { artifact: require("../build/Erasure_Agreements.json") },
    Erasure_Escrows: { artifact: require("../build/Erasure_Escrows.json") },
    Erasure_Posts: { artifact: require("../build/Erasure_Posts.json") },
    Erasure_Users: { artifact: require("../build/Erasure_Users.json") },
    OneWayGriefing_Factory: { artifact: require("../build/OneWayGriefing_Factory.json") },
    Feed_Factory: { artifact: require("../build/Feed_Factory.json") },
    Post_Factory: { artifact: require("../build/Post_Factory.json") },
    OneWayGriefing: { artifact: require("../build/OneWayGriefing.json") },
    Feed: { artifact: require("../build/Feed.json") },
    Post: { artifact: require("../build/Post.json") }
  };

  let tokenAddress;
  let deployer;
  let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY);
  let multisig;
  console.log(`Deployment Wallet: ${wallet.address}`);

  let defaultGas = ethers.utils.parseUnits('10', 'gwei');

  if (network == "rinkeby") {

    tokenAddress = "0x1eBf22785bffb6B44fEbBc8a41056b1aD43401f9";
    multisig = "0x6087555A70E2F96B7838806e7743041E035a37e5";

    // connect to rinkeby
    wallet = await wallet.connect(ethers.getDefaultProvider('rinkeby'));

    // initialize deployer
    deployer = await new etherlime.InfuraPrivateKeyDeployer(
      wallet.privateKey,
      "rinkeby",
      process.env.INFURA_API_KEY
    );
    deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY);

    // contracts.Erasure_Posts.instance = await new ethers.Contract('0xEd11206a7d07601985DCC4FeD7B3284a928D022B', contracts.Erasure_Posts.artifact.abi, wallet);

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deployAndVerify(contracts.Erasure_Posts.artifact);
    contracts.Erasure_Agreements.instance = await deployer.deployAndVerify(contracts.Erasure_Agreements.artifact);
    contracts.Erasure_Users.instance = await deployer.deployAndVerify(contracts.Erasure_Users.artifact);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deployAndVerify(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deployAndVerify(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.OneWayGriefing_Factory.instance = await deployer.deployAndVerify(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);

} else if (network == "mainnet") {

    tokenAddress = "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671";
    multisig = "0x0000000000377d181a0ebd08590c6b399b272000";

    // connect to rinkeby
    wallet = await wallet.connect(ethers.getDefaultProvider('homestead'));

    // initialize deployer
    deployer = await new etherlime.InfuraPrivateKeyDeployer(
      wallet.privateKey,
      "mainnet",
      process.env.INFURA_API_KEY,
      { gasPrice: defaultGas }
    );
    deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY);

    // contracts.Erasure_Posts.instance = await new ethers.Contract('0xF9F79CEe69175B51E4aB2b2D231460B61Ebb2688', contracts.Erasure_Posts.artifact.abi, wallet);
    // contracts.Erasure_Agreements.instance = await new ethers.Contract('0xF9F79CEe69175B51E4aB2b2D231460B61Ebb2688', contracts.Erasure_Agreements.artifact.abi, wallet);
    // contracts.Erasure_Users.instance = await new ethers.Contract('0xD5fa2751A560b6ca47219224Bc231c56a9849492', contracts.Erasure_Users.artifact.abi, wallet);
    // contracts.Post_Factory.instance = await new ethers.Contract('0x750EC6138205Cf1C36b446Dd540E0464E9C0e6Cd', contracts.Post_Factory.artifact.abi, wallet);
    // contracts.Feed_Factory.instance = await new ethers.Contract('0x276e1fdB65951B8c1d1c16C5B69a72bE3060E7AA', contracts.Feed_Factory.artifact.abi, wallet);
    // contracts.OneWayGriefing_Factory.instance = await new ethers.Contract('0x3A1a3EfeDf5C3932Bac1b637EA8Ac2D904C58480', contracts.OneWayGriefing_Factory.artifact.abi, wallet);

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deployAndVerify(contracts.Erasure_Posts.artifact);
    contracts.Erasure_Agreements.instance = await deployer.deployAndVerify(contracts.Erasure_Agreements.artifact);
    contracts.Erasure_Users.instance = await deployer.deployAndVerify(contracts.Erasure_Users.artifact);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deployAndVerify(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deployAndVerify(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.OneWayGriefing_Factory.instance = await deployer.deployAndVerify(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);

} else if (network == "ganache") {

    multisig = wallet.address;

    // initialize deployer
    deployer = new etherlime.EtherlimeGanacheDeployer();

    // deploy mock NMR
    contracts.MockNMR.instance = await deployer.deploy(contracts.MockNMR.artifact);
    tokenAddress = contracts.MockNMR.instance.contractAddress;

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deploy(contracts.Erasure_Posts.artifact);
    contracts.Erasure_Agreements.instance = await deployer.deploy(contracts.Erasure_Agreements.artifact);
    contracts.Erasure_Users.instance = await deployer.deploy(contracts.Erasure_Users.artifact);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deploy(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deploy(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.OneWayGriefing_Factory.instance = await deployer.deploy(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);
  }

  console.log(`
Register Factories
      `);

  await contracts.Erasure_Posts.instance.addFactory(
    contracts.Post_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0)
  ).then(async txn => {
      console.log(`addFactory() | Post_Factory => Erasure_Posts`);
      const receipt = await contracts.Erasure_Posts.instance.verboseWaitForTransaction(txn);
  });

  await contracts.Erasure_Posts.instance.addFactory(
    contracts.Feed_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0),
    { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`addFactory() | Feed_Factory => Erasure_Posts`);
      const receipt = await contracts.Erasure_Posts.instance.verboseWaitForTransaction(txn);
  });

  await contracts.Erasure_Agreements.instance.addFactory(
    contracts.OneWayGriefing_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0),
    { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`addFactory() | OneWayGriefing_Factory => Erasure_Agreements`);
      const receipt = await contracts.Erasure_Agreements.instance.verboseWaitForTransaction(txn);
  });

  console.log(`
Transfer Registry Ownership
      `);

  await contracts.Erasure_Posts.instance.transferOwnership(
      multisig,
      { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`transferOwnership() | Erasure_Posts => ${multisig}`);
      const receipt = await contracts.Erasure_Posts.instance.verboseWaitForTransaction(txn);
  });
  await contracts.Erasure_Agreements.instance.transferOwnership(
      multisig,
      { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`transferOwnership() | Erasure_Agreements => ${multisig}`);
      const receipt = await contracts.Erasure_Agreements.instance.verboseWaitForTransaction(txn);
  });

  console.log(`
Create test instances from factories
      `);

  const userAddress = '0x6087555A70E2F96B7838806e7743041E035a37e5';
  const proofHash = createMultihashSha256("proofHash");
  console.log(`multihash: ${proofHash}`);

  await contracts.Post_Factory.instance.createExplicit(
      userAddress,
      proofHash,
      '0x0',
      '0x0',
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.Post_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.Post.instance = new ethers.Contract(eventFound.args.instance, contracts.Post.artifact.abi, deployer.provider);
      console.log(`createExplicit() | Post_Factory => ${eventFound.args.instance}`);
  });

  await contracts.Feed_Factory.instance.createExplicit(
      userAddress,
      contracts.Erasure_Posts.instance.contractAddress,
      '0x0',
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.Feed_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.Feed.instance = new ethers.Contract(eventFound.args.instance, contracts.Feed.artifact.abi, deployer.provider);
      console.log(`createExplicit() | Feed_Factory => ${eventFound.args.instance}`);
  });

  await contracts.OneWayGriefing_Factory.instance.createExplicit(
      tokenAddress,
      userAddress,
      userAddress,
      userAddress,
      1,
      2,
      100000000,
      '0x0',
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.OneWayGriefing_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.OneWayGriefing.instance = new ethers.Contract(eventFound.args.instance, contracts.OneWayGriefing.artifact.abi, deployer.provider);
      console.log(`createExplicit() | OneWayGriefing_Factory => ${eventFound.args.instance}`);
  });

  console.log(``);

};

module.exports = { deploy };
