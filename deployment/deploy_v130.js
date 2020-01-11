const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const {
  hexlify,
  createIPFShash,
  abiEncodeWithSelector,
} = require('../test/helpers/utils')
const { RATIO_TYPES, TOKEN_TYPES } = require('../test/helpers/variables')
const assert = require('assert')

let { c } = require('./deploy_config')

require('dotenv').config()

const deploy = async (network, secret) => {
  let deployer
  let multisig

  let defaultGas = ethers.utils.parseUnits('15', 'gwei')
  let gasUsed = ethers.constants.Zero

  console.log(``)
  console.log(`Initialize Deployer`)
  console.log(``)

  // set owner address

  if (network == 'rinkeby') {
    ///////////////////////////////////////////////
    /* NOTE: Must update hardcoded token address */
    ///////////////////////////////////////////////
    multisig = '0x6087555A70E2F96B7838806e7743041E035a37e5'
  } else if (network == 'kovan') {
    ///////////////////////////////////////////////
    /* NOTE: Must update hardcoded token address */
    ///////////////////////////////////////////////
    multisig = '0x6087555A70E2F96B7838806e7743041E035a37e5'
  } else if (network == 'mainnet') {
    multisig = '0x0000000000377D181A0ebd08590c6B399b272000'
  }

  // initialize deployer

  deployer = await new etherlime.InfuraPrivateKeyDeployer(
    process.env.DEPLOYMENT_PRIV_KEY,
    network,
    process.env.INFURA_API_KEY,
    { gasPrice: defaultGas, etherscanApiKey: process.env.ETHERSCAN_API_KEY },
  )

  console.log(`Deployment Wallet: ${deployer.signer.address}`)

  console.log(``)
  console.log(`Get Deployed Registries`)
  console.log(``)

  // Erasure_Users
  await getUserRegistry('Erasure_Users')

  // Erasure_Posts
  await getRegistry('Erasure_Posts')

  // Erasure_Agreements
  await getRegistry('Erasure_Agreements')

  // Erasure_Escrows
  await getRegistry('Erasure_Escrows')

  console.log(``)
  console.log(`Deploy Factories`)
  console.log(``)

  // Feed
  await deployFactory('Feed', 'Erasure_Posts')

  // SimpleGriefing
  await deployFactory('SimpleGriefing', 'Erasure_Agreements')

  // CountdownGriefing
  await deployFactory('CountdownGriefing', 'Erasure_Agreements')

  // CountdownGriefingEscrow
  const abiEncoder = new ethers.utils.AbiCoder()
  const agreementFactory = abiEncoder.encode(
    ['address'],
    [c.CountdownGriefing.factory[network].address],
  )
  await deployFactory(
    'CountdownGriefingEscrow',
    'Erasure_Escrows',
    agreementFactory,
  )

  // console.log(``)
  // console.log(`Transfer Registry Ownership`)
  // console.log(``)

  // // Erasure_Posts
  // await transferRegistry('Erasure_Posts')

  // // Erasure_Agreements
  // await transferRegistry('Erasure_Agreements')

  // // Erasure_Escrows
  // await transferRegistry('Erasure_Escrows')

  console.log(``)
  console.log(`Create test instance from factories`)
  console.log(``)

  const userAddress = '0x6087555A70E2F96B7838806e7743041E035a37e5'
  const proofhash = ethers.utils.sha256(ethers.utils.toUtf8Bytes('proofhash'))
  const IPFShash = createIPFShash('multihash')
  console.log(`userAddress: ${userAddress}`)
  console.log(`proofhash: ${proofhash}`)
  console.log(`IPFShash: ${IPFShash}`)
  console.log(``)

  // Feed
  await createInstance(
    'Feed',
    abiEncodeWithSelector(
      'initialize',
      ['address', 'bytes'],
      [userAddress, IPFShash],
    ),
  )

  // SimpleGriefing
  await createInstance(
    'SimpleGriefing',
    abiEncodeWithSelector(
      'initialize',
      ['address', 'address', 'address', 'uint8', 'uint256', 'uint8', 'bytes'],
      [
        userAddress,
        userAddress,
        userAddress,
        TOKEN_TYPES.NMR,
        ethers.utils.parseEther('1'),
        RATIO_TYPES.Dec,
        IPFShash,
      ],
    ),
  )

  // CountdownGriefing
  await createInstance(
    'CountdownGriefing',
    abiEncodeWithSelector(
      'initialize',
      [
        'address',
        'address',
        'address',
        'uint8',
        'uint256',
        'uint8',
        'uint256',
        'bytes',
      ],
      [
        userAddress,
        userAddress,
        userAddress,
        TOKEN_TYPES.NMR,
        ethers.utils.parseEther('1'),
        RATIO_TYPES.Dec,
        100000000,
        IPFShash,
      ],
    ),
  )

  // CountdownGriefingEscrow
  await createInstance(
    'CountdownGriefingEscrow',
    abiEncodeWithSelector(
      'initialize',
      [
        'address',
        'address',
        'address',
        'uint8',
        'uint256',
        'uint256',
        'uint256',
        'bytes',
        'bytes',
      ],
      [
        userAddress,
        userAddress,
        userAddress,
        TOKEN_TYPES.NMR,
        ethers.utils.parseEther('1'),
        ethers.utils.parseEther('1'),
        100000000,
        IPFShash,
        abiEncoder.encode(
          ['uint256', 'uint8', 'uint256'],
          [ethers.utils.parseEther('1'), RATIO_TYPES.Dec, 100000000],
        ),
      ],
    ),
  )

  console.log(`
total gas used: ${gasUsed.toString()}

Registries:
  Erasure_Users           ${c.Erasure_Users[network].address}
  Erasure_Posts           ${c.Erasure_Posts[network].address}
  Erasure_Agreements      ${c.Erasure_Agreements[network].address}
  Erasure_Escrows         ${c.Erasure_Escrows[network].address}

Templates:
  Feed                    ${c.Feed.template[network].address}     
  SimpleGriefing          ${c.SimpleGriefing.template[network].address}
  CountdownGriefing       ${c.CountdownGriefing.template[network].address}
  CountdownGriefingEscrow ${c.CountdownGriefingEscrow.template[network].address}

Factories:
  Feed                    ${c.Feed.factory[network].address}
  SimpleGriefing          ${c.SimpleGriefing.factory[network].address}
  CountdownGriefing       ${c.CountdownGriefing.factory[network].address}
  CountdownGriefingEscrow ${c.CountdownGriefingEscrow.factory[network].address}
`)

  async function deployRegistry(registry) {
    // deploy registry
    await deployer.deployAndVerify(c[registry].artifact).then(wrap => {
      c[registry][network] = {
        wrap: wrap,
        address: wrap.contractAddress,
      }
    })

    // transfer registry ownership
    await c[registry][network].wrap.transferOwnership(
      c.RegistryManager[network].address,
    )

    return c[registry][network].wrap
  }

  async function getUserRegistry(registry) {
    // deploy registry if not deployed yet
    // const code = await deployer.provider.getCode(c[registry][network].address)
    if (c[registry][network].address.length === 0) {
      await deployer.deployAndVerify(c[registry].artifact).then(wrap => {
        c[registry][network] = {
          wrap: wrap,
          address: wrap.contractAddress,
        }
      })
    } else {
      // get registry at cached address
      c[registry][network].wrap = deployer.wrapDeployedContract(
        c[registry].artifact,
        c[registry][network].address,
      )
    }
  }

  async function getRegistry(registry) {
    c.RegistryManager[network].wrap = deployer.wrapDeployedContract(
      c.RegistryManager.artifact,
      c.RegistryManager[network].address,
    )

    // deploy registry if not deployed yet
    // const code = await deployer.provider.getCode(c[registry][network].address)
    if (c[registry][network].address.length === 0) {
      c[registry][network].wrap = await deployRegistry(registry)
    } else {
      // get registry at cached address
      c[registry][network].wrap = deployer.wrapDeployedContract(
        c[registry].artifact,
        c[registry][network].address,
      )
    }

    // validate ownership by RegistryManager
    assert.equal(
      await c[registry][network].wrap.owner(),
      c.RegistryManager[network].address,
    )

    // validate deployer is manager of RegistryManager
    assert.equal(
      await c.RegistryManager[network].wrap.manager(),
      deployer.signer.address,
    )

    console.log(`${registry} has valid manager: ${deployer.signer.address}`)
  }

  async function deployFactory(
    name,
    registry,
    factoryData = ethers.utils.hexlify(0x0),
  ) {
    await deployer.deployAndVerify(c[name].template.artifact).then(wrap => {
      c[name].template[network].address = wrap.contractAddress
    })

    c[name].template[network].wrap = await deployer.wrapDeployedContract(
      c[name].template.artifact,
      c[name].template[network].address,
    )

    assert.equal(
      await c[name].template[network].wrap.getTokenAddress(TOKEN_TYPES.NMR),
      c.NMR.token[network].address,
    )
    assert.equal(
      await c[name].template[network].wrap.getTokenAddress(TOKEN_TYPES.DAI),
      c.DAI.token[network].address,
    )
    // assert.equal(
    //   await c[name].template[network].wrap.getTokenAddress(TOKEN_TYPES.NMR),
    //   c.NMR.token[network].address,
    // )
    // assert.equal(
    //   await c[name].template.wrap.getTokenAddress(TOKEN_TYPES.DAI),
    //   c.DAI.token[network].address,
    // )

    await deployer
      .deployAndVerify(
        c[name].factory.artifact,
        false,
        c[registry][network].address,
        c[name].template[network].address,
      )
      .then(wrap => {
        c[name].factory[network].address = wrap.contractAddress
      })

    c[name].factory[network].wrap = await deployer.wrapDeployedContract(
      c[name].factory.artifact,
      c[name].factory[network].address,
    )

    await c.RegistryManager[network].wrap
      .addFactory(
        c[registry][network].address,
        c[name].factory[network].address,
        factoryData,
        {
          gasPrice: defaultGas,
        },
      )
      .then(async txn => {
        console.log(`addFactory() | ${name}_Factory => ${registry}`)
        const receipt = await c.RegistryManager[
          network
        ].wrap.verboseWaitForTransaction(txn)
        console.log(`gasUsed: ${receipt.gasUsed}`)
        console.log(``)
        gasUsed = gasUsed.add(receipt.gasUsed)
      })
  }

  async function transferRegistry(registry) {
    await c[registry][network].wrap
      .transferOwnership(multisig, { gasPrice: defaultGas })
      .then(async txn => {
        console.log(`transferOwnership() | ${registry} => ${multisig}`)
        const receipt = await c[registry][
          network
        ].wrap.verboseWaitForTransaction(txn)
        console.log(`gasUsed: ${receipt.gasUsed}`)
        console.log(``)
        gasUsed = gasUsed.add(receipt.gasUsed)
      })
  }

  async function createInstance(name, calldata) {
    await c[name].factory[network].wrap
      .create(calldata, { gasPrice: defaultGas })
      .then(async txn => {
        const receipt = await c[name].factory[
          network
        ].wrap.verboseWaitForTransaction(txn)
        const eventFound = receipt.events.find(
          emittedEvent => emittedEvent.event === 'InstanceCreated',
          'There is no such event',
        )

        c[name].instance[network].wrap = deployer.wrapDeployedContract(
          c[name].template.artifact,
          eventFound.args.instance,
        )

        console.log(
          `create() | ${receipt.gasUsed} gas | ${name}_Factory => ${eventFound.args.instance}`,
        )
        console.log(``)
        gasUsed = gasUsed.add(receipt.gasUsed)
      })
  }
}

module.exports = { deploy }
