const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const { createMultihashSha256, abiEncodeWithSelector } = require("../test/helpers/utils");

require("dotenv").config();

const deploy = async (network, secret) => {
  let contracts = {
    MockNMR: {artifact: require('../build/MockNMR.json')},
    Erasure_Agreements: { artifact: require("../build/Erasure_Agreements.json") },
    Erasure_Escrows: { artifact: require("../build/Erasure_Escrows.json") },
    Erasure_Posts: { artifact: require("../build/Erasure_Posts.json") },
    Erasure_Users: { artifact: require("../build/Erasure_Users.json") },
    SimpleGriefing_Factory: { artifact: require("../build/SimpleGriefing_Factory.json") },
    SimpleGriefing: { artifact: require("../build/SimpleGriefing.json") },
    CountdownGriefing_Factory: { artifact: require("../build/CountdownGriefing_Factory.json") },
    CountdownGriefing: { artifact: require("../build/CountdownGriefing.json") },
    Feed_Factory: { artifact: require("../build/Feed_Factory.json") },
    Feed: { artifact: require("../build/Feed.json") },
    Post_Factory: { artifact: require("../build/Post_Factory.json") },
    Post: { artifact: require("../build/Post.json") }
  };

  let tokenAddress;
  let deployer;
  let wallet;
  let multisig;

  let defaultGas = ethers.utils.parseUnits('10', 'gwei');
  let gasUsed = ethers.constants.Zero;

  if (network == "rinkeby") {

    wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY);
    console.log(`Deployment Wallet: ${wallet.address}`);

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
    contracts.CountdownGriefing_Factory.instance = await deployer.deployAndVerify(contracts.CountdownGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);

} else if (network == "mainnet") {

    wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY);
    console.log(`Deployment Wallet: ${wallet.address}`);

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

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deployAndVerify(contracts.Erasure_Posts.artifact);
    contracts.Erasure_Agreements.instance = await deployer.deployAndVerify(contracts.Erasure_Agreements.artifact);
    contracts.Erasure_Users.instance = await deployer.deployAndVerify(contracts.Erasure_Users.artifact);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deployAndVerify(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deployAndVerify(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.CountdownGriefing_Factory.instance = await deployer.deployAndVerify(contracts.CountdownGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);

} else if (network == "ganache") {

    // initialize deployer
    deployer = new etherlime.EtherlimeGanacheDeployer();
    multisig = deployer.signer.address;

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
    contracts.SimpleGriefing_Factory.instance = await deployer.deploy(contracts.SimpleGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);
    contracts.CountdownGriefing_Factory.instance = await deployer.deploy(contracts.CountdownGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);
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
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Erasure_Posts.instance.addFactory(
    contracts.Feed_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0),
    { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`addFactory() | Feed_Factory => Erasure_Posts`);
      const receipt = await contracts.Erasure_Posts.instance.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Erasure_Agreements.instance.addFactory(
    contracts.SimpleGriefing_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0),
    { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`addFactory() | SimpleGriefing_Factory => Erasure_Agreements`);
      const receipt = await contracts.Erasure_Agreements.instance.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Erasure_Agreements.instance.addFactory(
    contracts.CountdownGriefing_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0),
    { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`addFactory() | CountdownGriefing_Factory => Erasure_Agreements`);
      const receipt = await contracts.Erasure_Agreements.instance.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
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
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Erasure_Agreements.instance.transferOwnership(
      multisig,
      { gasPrice: defaultGas }
  ).then(async txn => {
      console.log(`transferOwnership() | Erasure_Agreements => ${multisig}`);
      const receipt = await contracts.Erasure_Agreements.instance.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  console.log(`
Create test instances from factories
      `);

  const userAddress = '0x6087555A70E2F96B7838806e7743041E035a37e5';
  const multihash = createMultihashSha256("multihash");
  console.log(`multihash: ${multihash}`);
  console.log(``);

  await contracts.Post_Factory.instance.create(
      abiEncodeWithSelector(
          'initialize',
          ['address', 'bytes', 'bytes'],
          [userAddress, multihash, multihash]
      ),
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.Post_Factory.instance.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(emittedEvent => emittedEvent.event === "InstanceCreated", "There is no such event");

      contracts.Post.instance = deployer.wrapDeployedContract(contracts.Post.artifact, eventFound.args.instance);
      console.log(`create() | ${receipt.gasUsed} gas | Post_Factory => ${eventFound.args.instance}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Feed_Factory.instance.create(
      abiEncodeWithSelector(
          'initialize',
          ['address', 'bytes'],
          [userAddress, multihash]
      ),
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.Feed_Factory.instance.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(emittedEvent => emittedEvent.event === "InstanceCreated", "There is no such event");

      contracts.Feed.instance = deployer.wrapDeployedContract(contracts.Feed.artifact, eventFound.args.instance);
      console.log(`create() | ${receipt.gasUsed} gas | Feed_Factory => ${eventFound.args.instance}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.Feed.instance.createPost(
      contracts.Post_Factory.instance.contractAddress,
      abiEncodeWithSelector(
          'initialize',
          ['address', 'bytes', 'bytes'],
          [userAddress, multihash, multihash]
      ),
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.Feed.instance.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(emittedEvent => emittedEvent.event === "PostCreated", "There is no such event");

      console.log(`createPost() | ${receipt.gasUsed} gas | Feed => ${eventFound.args.post}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.SimpleGriefing_Factory.instance.create(
      abiEncodeWithSelector(
          'initialize',
          ['address', 'address', 'address', 'address', 'uint256', 'uint8', 'bytes'],
          [tokenAddress, userAddress, userAddress, userAddress, 1, 2, '0x0']
      ),
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.SimpleGriefing_Factory.instance.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(emittedEvent => emittedEvent.event === "InstanceCreated", "There is no such event");

      contracts.SimpleGriefing.instance = deployer.wrapDeployedContract(contracts.SimpleGriefing.artifact, eventFound.args.instance);
      console.log(`create() | ${receipt.gasUsed} gas | SimpleGriefing_Factory => ${eventFound.args.instance}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  await contracts.CountdownGriefing_Factory.instance.create(
      abiEncodeWithSelector(
          'initialize',
          ['address', 'address', 'address', 'address', 'uint256', 'uint8', 'uint256', 'bytes'],
          [tokenAddress, userAddress, userAddress, userAddress, 1, 2, 100000000, '0x0']
      ),
      { gasPrice: defaultGas }
  ).then(async txn => {
      const receipt = await contracts.CountdownGriefing_Factory.instance.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(emittedEvent => emittedEvent.event === "InstanceCreated", "There is no such event");

      contracts.CountdownGriefing.instance = deployer.wrapDeployedContract(contracts.CountdownGriefing.artifact, eventFound.args.instance);
      console.log(`create() | ${receipt.gasUsed} gas | CountdownGriefing_Factory => ${eventFound.args.instance}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
  });

  console.log(``);
  console.log(`total gas used: ${gasUsed.toString()}`);

};

module.exports = { deploy };
