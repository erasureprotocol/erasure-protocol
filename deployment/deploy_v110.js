const etherlime = require("etherlime-lib");
const ethers = require("ethers");
const {
  hexlify,
  createMultihashSha256,
  abiEncodeWithSelector
} = require("../test/helpers/utils");
const assert = require("assert");

require("dotenv").config();

const deploy = async (network, secret) => {
  let c = {
    NMR: {
      artifact: require("../build/MockNMR.json"),
      mainnet: {
        address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671"
      },
      rinkeby: {
        address: "0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373"
      },
      ganache: {
        address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671"
      }
    },
    Erasure_Agreements: {
      artifact: require("../build/Erasure_Agreements.json"),
      mainnet: {
        address: "0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF"
      },
      rinkeby: {
        address: "0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC"
      },
      ganache: {
        address: "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24"
      }
    },
    Erasure_Posts: {
      artifact: require("../build/Erasure_Posts.json"),
      mainnet: {
        address: "0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29"
      },
      rinkeby: {
        address: "0x57EB544cCA126D356FFe19D732A79Db494ba09b1"
      },
      ganache: {
        address: "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
      }
    },
    SimpleGriefing: {
      factory: {
        artifact: require("../build/SimpleGriefing_Factory.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      template: {
        artifact: require("../build/SimpleGriefing.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      instance: {
        mainnet: {},
        rinkeby: {},
        ganache: {}
      }
    },
    CountdownGriefing: {
      factory: {
        artifact: require("../build/CountdownGriefing_Factory.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      template: {
        artifact: require("../build/CountdownGriefing.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      instance: {
        mainnet: {},
        rinkeby: {},
        ganache: {}
      }
    },
    Feed: {
      factory: {
        artifact: require("../build/Feed_Factory.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      template: {
        artifact: require("../build/Feed.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      instance: {
        mainnet: {},
        rinkeby: {},
        ganache: {}
      }
    },
    Post: {
      factory: {
        artifact: require("../build/Post_Factory.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      template: {
        artifact: require("../build/Post.json"),
        mainnet: {},
        rinkeby: {},
        ganache: {}
      },
      instance: {
        mainnet: {},
        rinkeby: {},
        ganache: {}
      }
    }
  };

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

    // deploy registries
    await deployer.deployAndVerify(c.Erasure_Posts.artifact).then(wrap => {
      c.Erasure_Posts[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });
    await deployer.deployAndVerify(c.Erasure_Agreements.artifact).then(wrap => {
      c.Erasure_Agreements[network] = {
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
  } else if (network == "ganache") {
    // initialize deployer
    deployer = new etherlime.EtherlimeGanacheDeployer();
    multisig = deployer.signer.address;

    // deploy registries
    await deployer.deploy(c.Erasure_Posts.artifact).then(wrap => {
      c.Erasure_Posts[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });
    await deployer.deploy(c.Erasure_Agreements.artifact).then(wrap => {
      c.Erasure_Agreements[network] = {
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

  console.log(`
Deploy Templates
          `);

  await deployer.deployAndVerify(c.Post.template.artifact).then(wrap => {
    c.Post.template[network] = {
      wrap: wrap,
      address: wrap.contractAddress
    };
  });

  await deployer.deployAndVerify(c.Feed.template.artifact).then(wrap => {
    c.Feed.template[network] = {
      wrap: wrap,
      address: wrap.contractAddress
    };
  });

  await deployer
    .deployAndVerify(c.SimpleGriefing.template.artifact)
    .then(wrap => {
      c.SimpleGriefing.template[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  await deployer
    .deployAndVerify(c.CountdownGriefing.template.artifact)
    .then(wrap => {
      c.CountdownGriefing.template[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  console.log(`
Deploy Factories
            `);

  await deployer
    .deployAndVerify(
      c.Post.factory.artifact,
      false,
      c.Erasure_Posts[network].address,
      c.Post.template[network].address
    )
    .then(wrap => {
      c.Post.factory[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  await deployer
    .deployAndVerify(
      c.Feed.factory.artifact,
      false,
      c.Erasure_Posts[network].address,
      c.Feed.template[network].address
    )
    .then(wrap => {
      c.Feed.factory[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  await deployer
    .deployAndVerify(
      c.SimpleGriefing.factory.artifact,
      false,
      c.Erasure_Agreements[network].address,
      c.SimpleGriefing.template[network].address
    )
    .then(wrap => {
      c.SimpleGriefing.factory[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  await deployer
    .deployAndVerify(
      c.CountdownGriefing.factory.artifact,
      false,
      c.Erasure_Agreements[network].address,
      c.CountdownGriefing.template[network].address
    )
    .then(wrap => {
      c.CountdownGriefing.factory[network] = {
        wrap: wrap,
        address: wrap.contractAddress
      };
    });

  console.log(`
Register Factories
      `);

  await c.Erasure_Posts[network].wrap
    .addFactory(c.Post.factory[network].address, ethers.utils.hexlify(0x0))
    .then(async txn => {
      console.log(`addFactory() | Post_Factory => Erasure_Posts`);
      const receipt = await c.Erasure_Posts[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Erasure_Posts[network].wrap
    .addFactory(c.Feed.factory[network].address, ethers.utils.hexlify(0x0), {
      gasPrice: defaultGas
    })
    .then(async txn => {
      console.log(`addFactory() | Feed_Factory => Erasure_Posts`);
      const receipt = await c.Erasure_Posts[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Erasure_Agreements[network].wrap
    .addFactory(
      c.SimpleGriefing.factory[network].address,
      ethers.utils.hexlify(0x0),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      console.log(
        `addFactory() | SimpleGriefing_Factory => Erasure_Agreements`
      );
      const receipt = await c.Erasure_Agreements[
        network
      ].wrap.verboseWaitForTransaction(txn);
      console.log(`gasUsed: ${receipt.gasUsed}`);
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Erasure_Agreements[network].wrap
    .addFactory(
      c.CountdownGriefing.factory[network].address,
      ethers.utils.hexlify(0x0),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      console.log(
        `addFactory() | CountdownGriefing_Factory => Erasure_Agreements`
      );
      const receipt = await c.Erasure_Agreements[
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

  console.log(`
Create test instance from factories
      `);

  const userAddress = "0x6087555A70E2F96B7838806e7743041E035a37e5";
  const multihash = createMultihashSha256("multihash");
  const hash = ethers.utils.keccak256(hexlify("multihash"));
  console.log(`multihash: ${multihash}`);
  console.log(`hash: ${hash}`);
  console.log(``);

  await c.Post.factory[network].wrap
    .create(
      abiEncodeWithSelector(
        "initialize",
        ["address", "bytes", "bytes"],
        [userAddress, multihash, multihash]
      ),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      const receipt = await c.Post.factory[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "InstanceCreated",
        "There is no such event"
      );

      c.Post.instance[network].wrap = deployer.wrapDeployedContract(
        c.Post.template.artifact,
        eventFound.args.instance
      );
      console.log(
        `create() | ${receipt.gasUsed} gas | Post_Factory => ${eventFound.args.instance}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Feed.factory[network].wrap
    .create(
      abiEncodeWithSelector(
        "initialize",
        ["address", "bytes", "bytes"],
        [userAddress, multihash, multihash]
      ),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      const receipt = await c.Feed.factory[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "InstanceCreated",
        "There is no such event"
      );

      c.Feed.instance[network].wrap = deployer.wrapDeployedContract(
        c.Feed.template.artifact,
        eventFound.args.instance
      );
      console.log(
        `create() | ${receipt.gasUsed} gas | Feed_Factory => ${eventFound.args.instance}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.Feed.instance[network].wrap
    .submitHash(hash, { gasPrice: defaultGas })
    .then(async txn => {
      const receipt = await c.Feed.instance[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "HashSubmitted",
        "There is no such event"
      );

      console.log(
        `submitHash() | ${receipt.gasUsed} gas | Feed => ${eventFound.args.index}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.SimpleGriefing.factory[network].wrap
    .create(
      abiEncodeWithSelector(
        "initialize",
        ["address", "address", "address", "uint256", "uint8", "bytes"],
        [
          userAddress,
          userAddress,
          userAddress,
          ethers.utils.parseEther("1"),
          2,
          "0x0"
        ]
      ),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      const receipt = await c.SimpleGriefing.factory[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "InstanceCreated",
        "There is no such event"
      );

      c.SimpleGriefing.instance[network].wrap = deployer.wrapDeployedContract(
        c.SimpleGriefing.template.artifact,
        eventFound.args.instance
      );
      console.log(
        `create() | ${receipt.gasUsed} gas | SimpleGriefing_Factory => ${eventFound.args.instance}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  await c.CountdownGriefing.factory[network].wrap
    .create(
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
      ),
      { gasPrice: defaultGas }
    )
    .then(async txn => {
      const receipt = await c.CountdownGriefing.factory[
        network
      ].wrap.verboseWaitForTransaction(txn);
      const eventFound = receipt.events.find(
        emittedEvent => emittedEvent.event === "InstanceCreated",
        "There is no such event"
      );

      c.CountdownGriefing.instance[
        network
      ].wrap = deployer.wrapDeployedContract(
        c.CountdownGriefing.template.artifact,
        eventFound.args.instance
      );
      console.log(
        `create() | ${receipt.gasUsed} gas | CountdownGriefing_Factory => ${eventFound.args.instance}`
      );
      console.log(``);
      gasUsed = gasUsed.add(receipt.gasUsed);
    });

  console.log(``);
  console.log(`total gas used: ${gasUsed.toString()}`);
};

module.exports = { deploy };
