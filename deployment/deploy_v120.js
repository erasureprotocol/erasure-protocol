const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const {
  hexlify,
  createIPFShash,
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

  console.log(``);
  console.log(`Initialize Deployer`);
  console.log(``);

  // set owner address

  if (network == "rinkeby") {
    multisig = "0x6087555A70E2F96B7838806e7743041E035a37e5";
  } else if (network == "mainnet") {
    multisig = "0x0000000000377d181a0ebd08590c6b399b272000";
  }

  // initialize deployer

  deployer = await new etherlime.InfuraPrivateKeyDeployer(
    process.env.DEPLOYMENT_PRIV_KEY,
    network,
    process.env.INFURA_API_KEY,
    { gasPrice: defaultGas, etherscanApiKey: process.env.ETHERSCAN_API_KEY }
  );

  console.log(`Deployment Wallet: ${deployer.signer.address}`);

  console.log(``);
  console.log(`Deploy Registries`);
  console.log(``);

  async function deployRegistry(registry) {
    await deployer.deployAndVerify(c[registry].artifact).then(wrap => {
      c[registry][network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });
  }

  // Erasure_Escrows

  await deployRegistry("Erasure_Escrows");

  console.log(``);
  console.log(`Get Deployed Registries`);
  console.log(``);

  async function getRegistry(registry) {

    // get registry at cached address
    c[registry][network].wrap = deployer.wrapDeployedContract(
      c[registry].artifact,
      c[registry][network].address
    );

    // validate ownership
    assert.equal(
      await c[registry][network].wrap.owner(),
      deployer.signer.address
    );

    console.log(`${registry} has valid owner: ${deployer.signer.address}`);
  }

  // Erasure_Posts

  await getRegistry("Erasure_Posts");

  // Erasure_Agreements

  await getRegistry("Erasure_Posts");

  // Erasure_Escrows

  await getRegistry("Erasure_Posts");

  console.log(``);
  console.log(`Deploy Templates`);
  console.log(``);

  async function deployTemplate(name) {
    await deployer.deployAndVerify(c[name].template.artifact).then(wrap => {
      c[name].template[network].address = wrap.contractAddress;
    });

    c[name].template[network].wrap = deployer.wrapDeployedContract(
      c[name].template.artifact,
      c[name].template[network].address
    );

    return c[name].template[network].wrap
  }

  // Feed

  await deployTemplate("Feed");

  // SimpleGriefing

  await deployTemplate("SimpleGriefing");

  // CountdownGriefing

  await deployTemplate("CountdownGriefing");

  // CountdownGriefingEscrow

  await deployTemplate("CountdownGriefingEscrow");

  console.log(``);
  console.log(`Deploy and Register Factories`);
  console.log(``);

  async function deployFactory(name, registry, factoryData = ethers.utils.hexlify(0x0)) {
    await deployer
      .deployAndVerify(
        c[name].factory.artifact,
        false,
        c[registry][network].address,
        c[name].template[network].address
      )
      .then(wrap => {
        c[name].factory[network].address = wrap.contractAddress;
      });

    c[name].factory[network].wrap = deployer.wrapDeployedContract(
      c[name].factory.artifact,
      c[name].factory[network].address
    );

    await c[registry][network].wrap
      .addFactory(
        c[name].factory[network].address,
        factoryData,
        { gasPrice: defaultGas }
      )
      .then(async txn => {
        console.log(
          `addFactory() | ${name}_Factory => ${registry}`
        );
        const receipt = await c[registry][network].wrap.verboseWaitForTransaction(txn);
        console.log(`gasUsed: ${receipt.gasUsed}`);
        console.log(``);
        gasUsed = gasUsed.add(receipt.gasUsed);
      });

    return c[name].factory[network].wrap
  }

  // Feed

  await deployFactory("Feed", "Erasure_Posts");

  // SimpleGriefing

  await deployFactory("SimpleGriefing", "Erasure_Agreements");

  // CountdownGriefing

  await deployFactory("CountdownGriefing", "Erasure_Agreements");

  // CountdownGriefingEscrow

  const abiEncoder = new ethers.utils.AbiCoder();
  const agreementFactory = abiEncoder.encode(['address'], [c.CountdownGriefing.factory[network].address]);
  await deployFactory("CountdownGriefingEscrow", "Erasure_Escrows", agreementFactory);

  console.log(``);
  console.log(`Transfer Registry Ownership`);
  console.log(``);

  async function transferRegistry(registry) {
    await c[registry][network].wrap
      .transferOwnership(multisig, { gasPrice: defaultGas })
      .then(async txn => {
        console.log(`transferOwnership() | ${registry} => ${multisig}`);
        const receipt = await c[registry][network].wrap.verboseWaitForTransaction(txn);
        console.log(`gasUsed: ${receipt.gasUsed}`);
        console.log(``);
        gasUsed = gasUsed.add(receipt.gasUsed);
      });
  }

  // Erasure_Posts

  await transferRegistry("Erasure_Posts");

  // Erasure_Agreements

  await transferRegistry("Erasure_Posts");

  // Erasure_Escrows

  await transferRegistry("Erasure_Posts");

  console.log(``);
  console.log(`Create test instance from factories`);
  console.log(``);

  const userAddress = "0x6087555A70E2F96B7838806e7743041E035a37e5";
  const proofhash = ethers.utils.sha256(ethers.utils.toUtf8Bytes("proofhash"));
  const IPFShash = createIPFShash("multihash"));
  console.log(`userAddress: ${userAddress}`);
  console.log(`proofhash: ${proofhash}`);
  console.log(`IPFShash: ${IPFShash}`);
  console.log(``);

  async function createInstance(name, calldata) {
    await c[name].factory[network].wrap
      .create(calldata, { gasPrice: defaultGas })
      .then(async txn => {
        const receipt = await c[name].factory[
          network
        ].wrap.verboseWaitForTransaction(txn);
        const eventFound = receipt.events.find(
          emittedEvent => emittedEvent.event === "InstanceCreated",
          "There is no such event"
        );

        c[name].instance[network].wrap = deployer.wrapDeployedContract(
          c[name].template.artifact,
          eventFound.args.instance
        );

        console.log(
          `create() | ${receipt.gasUsed} gas | ${name}_Factory => ${eventFound.args.instance}`
        );
        console.log(``);
        gasUsed = gasUsed.add(receipt.gasUsed);
      });
  }

  // Feed

  await createInstance("Feed", abiEncodeWithSelector(
    "initialize",
    ["address", "bytes32", "bytes"],
    [userAddress, proofhash, IPFShash]
  ));

  // SimpleGriefing

  await createInstance("SimpleGriefing", abiEncodeWithSelector(
    "initialize",
    ["address", "address", "address", "uint256", "uint8", "bytes"],
    [
      userAddress,
      userAddress,
      userAddress,
      ethers.utils.parseEther("1"),
      2,
      IPFShash
    ]
  ));

  // CountdownGriefing

  await createInstance("CountdownGriefing", abiEncodeWithSelector(
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
      IPFShash
    ]
  ));

  // CountdownGriefingEscrow

  await createInstance("CountdownGriefingEscrow", abiEncodeWithSelector(
    "initialize",
    ["address", "address", "address", "uint256", "uint256", "uint256", "bytes", "bytes"],
    [
      userAddress,
      userAddress,
      userAddress,
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("1"),
      100000000,
      IPFShash,
      abiEncoder.encode(["uint256", "uint8", "uint256"], [ethers.utils.parseEther("1"), 2, 100000000])
    ]
  ));

  console.log(``);
  console.log(`total gas used: ${gasUsed.toString()}`);
};

module.exports = { deploy };
