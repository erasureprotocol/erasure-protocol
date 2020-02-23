const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const assert = require('assert')
const fs = require('fs')

const {
  multihash,
  constants,
  encodeCreateCall,
} = require('@erasure/crypto-ipfs')
const { RATIO_TYPES, TOKEN_TYPES } = constants
const { ErasureV130 } = require('@erasure/abis')

require('dotenv').config()

const deploy = async (network, version) => {
  let deployer
  let multisig

  let defaultGas = ethers.utils.parseUnits('15', 'gwei')
  let gasUsed = ethers.constants.Zero

  console.log(`\nInitialize Deployer`)

  // prepare artifacts
  version = 'v1.3.0'
  const artifacts = await getArtifacts([
    'Feed',
    'SimpleGriefing',
    'CountdownGriefing',
    'CountdownGriefingEscrow',
    'Feed_Factory',
    'SimpleGriefing_Factory',
    'CountdownGriefing_Factory',
    'CountdownGriefingEscrow_Factory',
    'RegistryManager',
  ])

  // set owner address
  if (network === 'rinkeby' || network === 'kovan') {
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

  if (!ErasureV130.RegistryManager[network]) {
    // Erasure_Posts
    const Erasure_Posts = await getRegistry('Erasure_Posts')
    assert(
      await Erasure_Posts.owner(),
      deployer.signer.address,
      'Erasure_Posts owner is not deployer.',
    )
    // Erasure_Agreements
    const Erasure_Agreements = await getRegistry('Erasure_Agreements')
    assert(
      await Erasure_Posts.owner(),
      deployer.signer.address,
      'Erasure_Agreements owner is not deployer.',
    )
    // Erasure_Escrows
    const Erasure_Escrows = await getRegistry('Erasure_Escrows')
    assert(
      await Erasure_Posts.owner(),
      deployer.signer.address,
      'Erasure_Escrows owner is not deployer.',
    )

    console.log(`\nDeploy RegistryManager`)

    const RegistryManager = await deployer.deployAndVerify(
      artifacts.RegistryManager,
    )
    ErasureV130.RegistryManager[network] = RegistryManager.contractAddress

    console.log(`\nTransfer RegistryManager ownership to Multisig`)

    await RegistryManager.transferOwnership(multisig)

    console.log(`\nTransfer all registry ownership to RegistryManager`)

    // Erasure_Posts
    await Erasure_Posts.transferOwnership(RegistryManager.address)
    // Erasure_Agreements
    await Erasure_Agreements.transferOwnership(RegistryManager.address)
    // Erasure_Escrows
    await Erasure_Escrows.transferOwnership(RegistryManager.address)
  }

  console.log(`\nDeploy Factories`)

  // Feed
  const Feed_Factory = await deployFactory('Feed', 'Erasure_Posts')
  // SimpleGriefing
  const SimpleGriefing_Factory = await deployFactory(
    'SimpleGriefing',
    'Erasure_Agreements',
  )
  // CountdownGriefing
  const CountdownGriefing_Factory = await deployFactory(
    'CountdownGriefing',
    'Erasure_Agreements',
  )
  // CountdownGriefingEscrow
  const CountdownGriefingEscrow_Factory = await deployFactory(
    'CountdownGriefingEscrow',
    'Erasure_Escrows',
    ethers.utils.defaultAbiCoder.encode(
      ['address'],
      [CountdownGriefing_Factory.contractAddress],
    ),
  )

  console.log(`\nCreate test instance from factories`)

  const mockData = {
    userAddress: '0x6087555A70E2F96B7838806e7743041E035a37e5',
    proofhash: await multihash({
      input: 'proof',
      inputType: 'raw',
      outputType: 'digest',
    }),
    metadata: ethers.utils.toUtf8Bytes(
      JSON.stringify({
        metadata_version: 'v1.0.0',
        application: 'deployment-test',
        app_version: 'v0.0.1',
        app_storage: { this_is: 'an example metadata for the app' },
        ipld_cid: await multihash({
          input: 'metadata',
          inputType: 'raw',
          outputType: 'hex',
        }),
      }),
    ),
  }

  // Feed
  await createInstance('Feed', Feed_Factory, [
    mockData.userAddress, // operator
    mockData.metadata, // metadata
  ])
  // SimpleGriefing
  await createInstance('SimpleGriefing', SimpleGriefing_Factory, [
    mockData.userAddress, // operator
    mockData.userAddress, // staker
    mockData.userAddress, // counterparty
    constants.TOKEN_TYPES.NMR, // tokenID
    ethers.utils.parseEther('1'), // griefRatio
    constants.RATIO_TYPES.Dec, // ratioType
    mockData.metadata, // metadata
  ])
  // CountdownGriefing
  await createInstance('CountdownGriefing', CountdownGriefing_Factory, [
    mockData.userAddress, // operator
    mockData.userAddress, // staker
    mockData.userAddress, // counterparty
    constants.TOKEN_TYPES.NMR, // tokenID
    ethers.utils.parseEther('1'), // griefRatio
    constants.RATIO_TYPES.Dec, // ratioType
    100000000, // agreementLength
    mockData.metadata, // metadata
  ])
  // CountdownGriefingEscrow
  await createInstance(
    'CountdownGriefingEscrow',
    CountdownGriefingEscrow_Factory,
    [
      mockData.userAddress, // operator
      mockData.userAddress, // staker
      mockData.userAddress, // counterparty
      constants.TOKEN_TYPES.NMR, // tokenID
      ethers.utils.parseEther('1'), // paymentAmount
      ethers.utils.parseEther('1'), // stakeAmount
      100000000, // escrowLength
      mockData.metadata, // metadata
      ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint8', 'uint256'],
        [
          ethers.utils.parseEther('1'), // griefRatio
          constants.RATIO_TYPES.Dec, // ratioType
          100000000, // agreementLength
        ],
      ), // agreementParams
    ],
  )

  // save artifacts
  // TODO: save addresses to abi package
  await saveArtifacts(version)

  console.log(`
Deployment Addresses
------------------------------------------------------------------

Multisig:        ${multisig}
RegistryManager: ${ErasureV130.RegistryManager[network]}

NMR:
  Token          ${ErasureV130.NMR[network]}
  Uniswap        ${ErasureV130.NMR_Uniswap[network]}
DAI:
  Token          ${ErasureV130.DAI[network]}
  Uniswap        ${ErasureV130.DAI_Uniswap[network]}

Registries:
  Erasure_Users           ${ErasureV130.Erasure_Users[network]}
  Erasure_Posts           ${ErasureV130.Erasure_Posts[network]}
  Erasure_Agreements      ${ErasureV130.Erasure_Agreements[network]}
  Erasure_Escrows         ${ErasureV130.Erasure_Escrows[network]}

Templates:
  Feed                    ${ErasureV130.Feed[network]}
  SimpleGriefing          ${ErasureV130.SimpleGriefing[network]}
  CountdownGriefing       ${ErasureV130.CountdownGriefing[network]}
  CountdownGriefingEscrow ${ErasureV130.CountdownGriefingEscrow[network]}

Factories:
  Feed                    ${ErasureV130.Feed_Factory[network]}
  SimpleGriefing          ${ErasureV130.SimpleGriefing_Factory[network]}
  CountdownGriefing       ${ErasureV130.CountdownGriefing_Factory[network]}
  CountdownGriefingEscrow ${ErasureV130.CountdownGriefingEscrow_Factory[network]}
  `)

  async function getRegistry(registryName) {
    // deploy registry if not deployed yet
    let registry
    if (!ErasureV130[registryName][network]) {
      // deploy registry
      registry = await deployer.deployAndVerify(
        ErasureV130[registryName].artifact,
      )
    } else {
      // get registry at cached address
      registry = deployer.wrapDeployedContract(
        ErasureV130[registryName].artifact,
        ErasureV130[registryName][network],
      )
    }
  }

  async function deployFactory(
    templateName,
    registryName,
    factoryData = ethers.utils.hexlify(0x0),
  ) {
    // deploy template
    const template = await deployer.deployAndVerify(artifacts[templateName])
    ErasureV130[templateName][network] = template.contractAddress

    // validate token and exchange addresses
    assert.equal(
      await template.getTokenAddress(TOKEN_TYPES.NMR),
      ErasureV130.NMR[network],
      'Wrong NMR address',
    )
    assert.equal(
      await template.getTokenAddress(TOKEN_TYPES.DAI),
      ErasureV130.DAI[network],
      'Wrong DAI address',
    )
    assert.equal(
      await template.getExchangeAddress(TOKEN_TYPES.NMR),
      ErasureV130.NMR_Uniswap[network],
      'Wrong NMR_Uniswap address',
    )
    assert.equal(
      await template.getExchangeAddress(TOKEN_TYPES.DAI),
      ErasureV130.DAI_Uniswap[network],
      'Wrong DAI_Uniswap address',
    )

    // deploy factory
    const factoryName = templateName.concat('_Factory')
    const factory = await deployer.deployAndVerify(
      artifacts[factoryName],
      false,
      ErasureV130[registryName][network],
      template.contractAddress,
    )
    ErasureV130[factoryName][network] = factory.contractAddress

    // register factory
    console.log(``)
    const RegistryManager = deployer.wrapDeployedContract(
      artifacts.RegistryManager,
      ErasureV130.RegistryManager[network],
    )

    // validate deployer is manager of RegistryManager
    assert.equal(
      await RegistryManager.manager(),
      deployer.signer.address,
      `Deployer is not registry manager. Expected ${await RegistryManager.manager()} got ${
        deployer.signer.address
      }`,
    )

    const tx = await RegistryManager.addFactory(
      ErasureV130[registryName][network],
      factory.contractAddress,
      factoryData,
      {
        gasPrice: defaultGas,
      },
    )
    await RegistryManager.verboseWaitForTransaction(tx)

    return factory
  }

  async function getArtifacts(contracts) {
    let artifacts = {}
    contracts.forEach(element => {
      const artifact = require(`../build/${element}.json`)
      artifacts[artifact.contractName] = artifact
    })
    return artifacts
  }

  async function saveArtifacts(version) {
    for (const [contractName, artifact] of Object.entries(artifacts)) {
      // drop unwanted fields
      const abi = {
        contractName: artifact.contractName,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
        sourceMap: artifact.sourceMap,
        deployedSourceMap: artifact.deployedSourceMap,
        source: artifact.source,
        compiler: artifact.compiler,
      }
      // write to destinaton
      fs.writeFileSync(
        `./packages/abis/src/${version}/abis/${artifact.contractName}.json`,
        JSON.stringify(abi),
        'utf8',
      )
    }
  }

  async function createInstance(templateName, factory, params = []) {
    // get calldata
    const calldata = encodeCreateCall(artifacts[templateName].abi, params)
    // create
    const createReceipt = await (await factory.create(calldata)).wait()
    console.log(
      `create()      | ${createReceipt.gasUsed.toString()} gas | ${templateName}`,
    )
    // createSalty
    const testSalt = ethers.utils.id('testSalt')
    const createSaltyReceipt = await (
      await factory.createSalty(calldata, testSalt)
    ).wait()
    console.log(
      `createSalty() | ${createSaltyReceipt.gasUsed.toString()} gas | ${templateName}`,
    )
  }
}

module.exports = { deploy }
