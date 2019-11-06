const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const {
  hexlify,
  createMultihashSha256,
  abiEncodeWithSelector
} = require("../test/helpers/utils");
const assert = require("assert");

let { c } = require("./deploy_config");

require("dotenv").config();

const deploy = async (network, secret) => {


  let deployer;
  let multisig;

  let defaultGas = ethers.utils.parseUnits("15", "gwei");
  let gasUsed = ethers.constants.Zero;

  if (network == "rinkeby") {
    // set owner address
    multisig = "0x6087555A70E2F96B7838806e7743041E035a37e5";

    // initialize deployer
    deployer = await new etherlime.InfuraPrivateKeyDeployer(
      process.env.DEPLOYMENT_PRIV_KEY,
      "rinkeby",
      process.env.INFURA_API_KEY,
      { gasPrice: defaultGas, etherscanApiKey: process.env.ETHERSCAN_API_KEY }
    );

    console.log(`Deployment Wallet: ${deployer.signer.address}`);

    // deploy escrow registry
    await deployer.deployAndVerify(c.Erasure_Escrows.artifact).then(wrap => {
      c.Erasure_Escrows[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });
  } else if (network == "mainnet") {
    // set owner address
    multisig = "0x0000000000377d181a0ebd08590c6b399b272000";

    // initialize deployer
    deployer = await new etherlime.InfuraPrivateKeyDeployer(
      process.env.DEPLOYMENT_PRIV_KEY,
      "mainnet",
      process.env.INFURA_API_KEY,
      { gasPrice: defaultGas, etherscanApiKey: process.env.ETHERSCAN_API_KEY }
    );

    console.log(`Deployment Wallet: ${deployer.signer.address}`);

    // deploy escrow registry
    await deployer.deployAndVerify(c.Erasure_Escrows.artifact).then(wrap => {
      c.Erasure_Escrows[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });
  }

  console.log(`
Get Deployed Registries
      `);

  c.Erasure_Posts[network].wrap = deployer.wrapDeployedContract(
    c.Erasure_Posts.artifact,
    c.Erasure_Posts[network].address
  );
  c.Erasure_Agreements[network].wrap = deployer.wrapDeployedContract(
    c.Erasure_Agreements.artifact,
    c.Erasure_Agreements[network].address
  );
  c.Erasure_Escrows[network].wrap = deployer.wrapDeployedContract(
    c.Erasure_Escrows.artifact,
    c.Erasure_Escrows[network].address
  );

  console.log(`
Validate Ownership
      `);

  assert.equal(
    await c.Erasure_Posts[network].wrap.owner(),
    deployer.signer.address
  );
  console.log(`Erasure_Posts has valid owner: ${deployer.signer.address}`);

  assert.equal(
    await c.Erasure_Agreements[network].wrap.owner(),
    deployer.signer.address
  );
  console.log(`Erasure_Agreements has valid owner: ${deployer.signer.address}`);

  assert.equal(
    await c.Erasure_Escrows[network].wrap.owner(),
    deployer.signer.address
  );
  console.log(`Erasure_Escrows has valid owner: ${deployer.signer.address}`);

  console.log(`
Deploy Templates
          `);

  await deployer.deployAndVerify(c.CountdownGriefingEscrow.template.artifact).then(wrap => {
    c.CountdownGriefingEscrow.template[network].address = wrap.contractAddress;
  });

  c.CountdownGriefingEscrow.template[network].wrap = deployer.wrapDeployedContract(
    c.CountdownGriefingEscrow.template.artifact,
    c.CountdownGriefingEscrow.template[network].address
  );

  console.log(`
Deploy Factories
            `);

  await deployer
    .deployAndVerify(
      c.CountdownGriefingEscrow.factory.artifact,
      false,
      c.Erasure_Escrows[network].address,
      c.CountdownGriefingEscrow.template[network].address
    )
    .then(wrap => {
      c.CountdownGriefingEscrow.factory[network].address = wrap.contractAddress;
    });

  c.CountdownGriefingEscrow.factory[network].wrap = deployer.wrapDeployedContract(
    c.CountdownGriefingEscrow.factory.artifact,
    c.CountdownGriefingEscrow.factory[network].address
  );

  console.log(`
Register Factories
      `);

  const abiEncoder = new ethers.utils.AbiCoder();
  const agreementFactory = abiEncoder.encode(['address'], [c.CountdownGriefing.factory[network].address]);

  await c.Erasure_Escrows[network].wrap
    .addFactory(
      c.CountdownGriefingEscrow.factory[network].address,
      agreementFactory,
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      console.log(
        `addFactory() | CountdownGriefingEscrow_Factory => Erasure_Escrows`
      );
      const receipt = await c.Erasure_Escrows[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  console.log(`
Transfer Registry Ownership
      `);

  await c.Erasure_Posts[network].wrap
    .transferOwnership(multisig, { gasPrice: defaultGas })
    .then(async txn => {
      console.log(`transferOwnership() | Erasure_Posts => ${multisig}`);
      const receipt = await c.Erasure_Posts[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Erasure_Agreements[network].wrap
    .transferOwnership(multisig, { gasPrice: defaultGas })
    .then(async txn => {
      console.log(`transferOwnership() | Erasure_Agreements => ${multisig}`);
      const receipt = await c.Erasure_Agreements[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Erasure_Escrows[network].wrap
    .transferOwnership(multisig, { gasPrice: defaultGas })
    .then(async txn => {
      console.log(`transferOwnership() | Erasure_Escrows => ${multisig}`);
      const receipt = await c.Erasure_Escrows[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  console.log(`
Create test instance from factories
      `);

  const userAddress = "0x6087555A70E2F96B7838806e7743041E035a37e5";
  const multihash = createMultihashSha256("multihash");
  const hash = ethers.utils.keccak256(hexlify("multihash"));
  console.log(`multihash: ${multihash}`);
  console.log(`hash: ${hash}`);
  console.log(``);

  await c.CountdownGriefingEscrow.factory[network].wrap
    .create(
      abiEncodeWithSelector(
        "initialize",
        ["address", "address", "address", "uint256", "uint256", "uint256", "bytes", "bytes"],
        [
          userAddress,
          userAddress,
          userAddress,
          ethers.utils.parseEther("1"),
          ethers.utils.parseEther("1"),
          100000000,
          "0x0",
          abiEncodeWithSelector(
            "initialize",
            [
              "address",
              "address",
              "address",
              "uint256",
              "uint8",
              "uint256",
              "bytes"
            ],
            [
              userAddress,
              userAddress,
              userAddress,
              ethers.utils.parseEther("1"),
              2,
              100000000,
              "0x0"
            ]
          )
        ]
      ),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      const receipt = await c.CountdownGriefingEscrow.factory[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "InstanceCreated",
        "There is no such event"
      );

      c.CountdownGriefingEscrow.instance[network].wrap = deployer.wrapDeployedContract(
        c.CountdownGriefingEscrow.template.artifact,
        eventFound.args.instance
      );
      console.log(
        `create() | ${receipt.gasUsed} gas | CountdownGriefingEscrow_Factory => ${eventFound.args.instance}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  console.log(``);
  console.log(`total gas used: ${gasUsed.toString()}`);
};

module.exports = { deploy };
