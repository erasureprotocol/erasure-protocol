const ethers = require("ethers");
const assert = require("assert");
const ganache = require("ganache-cli");
const {
  hexlify,
  createIPFShash,
  abiEncodeWithSelector
} = require("./utils");

let c = {
  NMR: {
    artifact: require("./artifacts/MockNMR.json")
  },
  Erasure_Agreements: {
    artifact: require("./artifacts/Erasure_Agreements.json")
  },
  Erasure_Posts: {
    artifact: require("./artifacts/Erasure_Posts.json")
  },
  Erasure_Escrows: {
    artifact: require("./artifacts/Erasure_Escrows.json")
  },
  SimpleGriefing: {
    factory: {
      artifact: require("./artifacts/SimpleGriefing_Factory.json")
    },
    template: {
      artifact: require("./artifacts/SimpleGriefing.json")
    }
  },
  CountdownGriefing: {
    factory: {
      artifact: require("./artifacts/CountdownGriefing_Factory.json")
    },
    template: {
      artifact: require("./artifacts/CountdownGriefing.json")
    }
  },
  CountdownGriefingEscrow: {
    factory: {
      artifact: require("./artifacts/CountdownGriefingEscrow_Factory.json")
    },
    template: {
      artifact: require("./artifacts/CountdownGriefingEscrow.json")
    }
  },
  Feed: {
    factory: {
      artifact: require("./artifacts/Feed_Factory.json")
    },
    template: {
      artifact: require("./artifacts/Feed.json")
    }
  }
};

let ganacheConfig = {
  port: 8545,
  unlocked_accounts: ["0x9608010323ed882a38ede9211d7691102b4f0ba0"],
  default_balance_ether: 1000,
  total_accounts: 10,
  hardfork: "constantinople",
  mnemonic:
    "myth like bonus scare over problem client lizard pioneer submit female collect"
};

const server = ganache.server(ganacheConfig);
server.listen("8545");

const provider = new ethers.providers.JsonRpcProvider();
const deployKey =
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d";
const nmrDeployAddress = "0x9608010323ed882a38ede9211d7691102b4f0ba0";
const deploymentWallet = new ethers.Wallet(deployKey, provider);

const sendEthToNMRSigner = async () => {
  // empty out the default signer's balance
  // and send to nmr signer
  const defaultSigner = provider.getSigner(9);
  const balance = await defaultSigner.getBalance(defaultSigner.address);
  const gasPrice = await provider.getGasPrice();
  const gasLimit = 21000;
  const value = balance.sub(gasPrice.mul(gasLimit));

  await defaultSigner.sendTransaction({
    to: nmrDeployAddress,
    value
  });
};

async function deployer(artifact, params, signer) {
  const factory = new ethers.ContractFactory(
    artifact.compilerOutput.abi,
    artifact.compilerOutput.evm.bytecode.object,
    signer
  );
  const contract = await factory.deploy(...params);
  const receipt = await provider.getTransactionReceipt(
    contract.deployTransaction.hash
  );
  return [contract, receipt];
}

async function deployContract(contractName, params, signer) {
  const [contract, receipt] = await deployer(
    c[contractName].artifact,
    params,
    signer
  );
  console.log(
    `Deploy | ${
    contract.address
    } | ${contractName} | ${receipt.gasUsed.toString()} gas`
  );
  return [contract, receipt];
}

async function deployFactory(contractName, registry, signer, factoryData = "0x0") {
  let templateContract;
  await deployer(c[contractName].template.artifact, [], signer).then(
    ([contract, receipt]) => {
      templateContract = contract;
      console.log(
        `Deploy | ${
        contract.address
        } | ${contractName} | Template | ${receipt.gasUsed.toString()} gas`
      );
    }
  );

  let factoryContract;
  await deployer(
    c[contractName].factory.artifact,
    [registry.address, templateContract.address],
    signer
  ).then(([contract, receipt]) => {
    factoryContract = contract;
    console.log(
      `Deploy | ${
      contract.address
      } | ${contractName} | Factory | ${receipt.gasUsed.toString()} gas`
    );
  });

  let tx = await registry
    .addFactory(factoryContract.address, factoryData)
    .then(async tx => {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      console.log(
        `addFactory() | ${contractName} | ${receipt.gasUsed.toString()} gas`
      );
    });

  return [templateContract, factoryContract];
}

async function deployNMR(signer) {
  await sendEthToNMRSigner();
  console.log("NMR Signer balance updated");

  // needs to increment the nonce to 1 by
  await signer.sendTransaction({ to: signer.address, value: 0 });

  let nmrAddress = "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671";
  [contract, receipt] = await deployContract("NMR", [], signer);

  assert.equal(contract.address, nmrAddress);

  return [contract, receipt];
}

const main = async () => {
  process.on("unhandledRejection", function (error) {
    console.error(error);
    process.exit(1);
  });
  // console.log(provider);
  // console.log(await provider.listAccounts());

  let deploySigner = provider.getSigner(0);
  let nmrSigner = provider.getSigner(nmrDeployAddress);

  console.log(`
Deploy MockNMR
      `);

  [c.NMR.wrap, _] = await deployNMR(nmrSigner);

  console.log(`
Deploy Registries
      `);

  [c.Erasure_Posts.wrap, _] = await deployContract(
    "Erasure_Posts",
    [],
    deploySigner
  );
  [c.Erasure_Agreements.wrap, _] = await deployContract(
    "Erasure_Agreements",
    [],
    deploySigner
  );
  [c.Erasure_Escrows.wrap, _] = await deployContract(
    "Erasure_Escrows",
    [],
    deploySigner
  );

  console.log(`
Deploy Factories
      `);

  [
    c.SimpleGriefing.template.wrap,
    c.SimpleGriefing.factory.wrap
  ] = await deployFactory(
    "SimpleGriefing",
    c.Erasure_Agreements.wrap,
    deploySigner
  );

  [
    c.CountdownGriefing.template.wrap,
    c.CountdownGriefing.factory.wrap
  ] = await deployFactory(
    "CountdownGriefing",
    c.Erasure_Agreements.wrap,
    deploySigner
  );

  [c.Feed.template.wrap, c.Feed.factory.wrap] = await deployFactory(
    "Feed",
    c.Erasure_Posts.wrap,
    deploySigner
  );

  const abiEncoder = new ethers.utils.AbiCoder();
  const agreementFactory = abiEncoder.encode(['address'], [c.CountdownGriefing.factory[network].address]);

  [c.CountdownGriefingEscrow.template.wrap, c.CountdownGriefingEscrow.factory.wrap] = await deployFactory(
    "CountdownGriefingEscrow",
    c.Erasure_Escrows.wrap,
    deploySigner,
    agreementFactory
  );

  if (args.exit_on_success) process.exit(0);
};

var ArgumentParser = require("argparse").ArgumentParser;
var parser = new ArgumentParser({
  version: "0.0.1",
  addHelp: true,
  description: "Argparse example"
});
parser.addArgument(["-e", "--exit-on-success"], {
  help: "foo bar",
  action: "storeTrue"
});
var args = parser.parseArgs();

main(args);
