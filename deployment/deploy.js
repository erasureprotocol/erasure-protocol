const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const { createMultihashSha256 } = require("../test/helpers/utils");
require("dotenv").config();

const tokenAddress = "0x1eBf22785bffb6B44fEbBc8a41056b1aD43401f9";

const deploy = async (network, secret) => {
  let contracts = {
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

  let deployer;
  let wallet = new ethers.Wallet(process.env.DEPLOYMENT_PRIV_KEY);
  console.log(`Deployment Wallet: ${wallet.address}`);

  if (network == "rinkeby") {
    // initialize deployer
    deployer = await new etherlime.InfuraPrivateKeyDeployer(
      wallet.privateKey,
      "rinkeby",
      process.env.INFURA_API_KEY
    );
    deployer.setVerifierApiKey(process.env.ETHERSCAN_API_KEY);

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deployAndVerify(contracts.Erasure_Posts.artifact, false);
    contracts.Erasure_Agreements.instance = await deployer.deployAndVerify(contracts.Erasure_Agreements.artifact, false);
    contracts.Erasure_Users.instance = await deployer.deployAndVerify(contracts.Erasure_Users.artifact, false);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deployAndVerify(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deployAndVerify(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.OneWayGriefing_Factory.instance = await deployer.deployAndVerify(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);

} else if (network == "ganache") {
    // initialize deployer
    deployer = new etherlime.EtherlimeGanacheDeployer();

    // deploy registries
    contracts.Erasure_Posts.instance = await deployer.deploy(contracts.Erasure_Posts.artifact, false);
    contracts.Erasure_Agreements.instance = await deployer.deploy(contracts.Erasure_Agreements.artifact, false);
    contracts.Erasure_Users.instance = await deployer.deploy(contracts.Erasure_Users.artifact, false);

    // deploy factories
    contracts.Post_Factory.instance = await deployer.deploy(contracts.Post_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.Feed_Factory.instance = await deployer.deploy(contracts.Feed_Factory.artifact, false, contracts.Erasure_Posts.instance.contractAddress);
    contracts.OneWayGriefing_Factory.instance = await deployer.deploy(contracts.OneWayGriefing_Factory.artifact, false, contracts.Erasure_Agreements.instance.contractAddress);
  }

  // register factories

  await contracts.Erasure_Posts.instance.addFactory(
    contracts.Post_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0)
  );
  console.log('Post_Factory is registered');
  await contracts.Erasure_Posts.instance.addFactory(
    contracts.Feed_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0)
  );
  console.log('Feed_Factory is registered');
  await contracts.Erasure_Agreements.instance.addFactory(
    contracts.OneWayGriefing_Factory.instance.contractAddress,
    ethers.utils.hexlify(0x0)
  );
  console.log('OneWayGriefing_Factory is registered');

  // attempt to create instances

  const userAddress = '0x6087555A70E2F96B7838806e7743041E035a37e5';
  const proofHash = createMultihashSha256("proofHash");
  console.log(proofHash);

  await contracts.Post_Factory.instance.createExplicit(
      userAddress,
      proofHash,
      '0x0',
      '0x0'
  ).then(async txn => {
      const receipt = await contracts.Post_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.Post.instance = new ethers.Contract(eventFound.args.instance, contracts.Post.artifact.abi, deployer.provider);
      console.log(`Post instance created at ${eventFound.args.instance} by ${await contracts.Post.instance.getCreator()}`);
  });

  await contracts.Feed_Factory.instance.createExplicit(
      userAddress,
      contracts.Erasure_Posts.instance.contractAddress,
      '0x0'
  ).then(async txn => {
      const receipt = await contracts.Feed_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.Feed.instance = new ethers.Contract(eventFound.args.instance, contracts.Feed.artifact.abi, deployer.provider);
      console.log(`Feed instance created at ${eventFound.args.instance} by ${await contracts.Feed.instance.getCreator()}`);
  });

  await contracts.OneWayGriefing_Factory.instance.createExplicit(
      tokenAddress,
      userAddress,
      userAddress,
      userAddress,
      1,
      4,
      100000000,
      '0x0'
  ).then(async txn => {
      const receipt = await contracts.OneWayGriefing_Factory.instance.verboseWaitForTransaction(txn);
      const expectedEvent = "InstanceCreated";
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        "There is no such event"
      );
      contracts.OneWayGriefing.instance = new ethers.Contract(eventFound.args.instance, contracts.OneWayGriefing.artifact.abi, deployer.provider);
      console.log(`OneWayGriefing instance created at ${eventFound.args.instance} by ${await contracts.OneWayGriefing.instance.getCreator()}`);
  });

};

module.exports = {
  deploy
};
