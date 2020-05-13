const ethers = require('ethers')
const ganache = require('ganache-cli')
const assert = require('assert')
const fs = require('fs')

const { ErasureV130 } = require('@erasure/abis')
const {
  multihash,
  constants,
  encodeCreateCall,
} = require('@erasure/crypto-ipfs')

// TODO: move to helper package
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
const deployer = async (artifact, params, signer) => {
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer,
  )
  const contract = await factory.deploy(...params)
  const receipt = await provider.getTransactionReceipt(
    contract.deployTransaction.hash,
  )
  return { contract, receipt }
}

const deployContract = async (contractName, signer, params = []) => {
  const artifact = ErasureV130[contractName].artifact
  const { contract, receipt } = await deployer(artifact, params, signer)
  console.log(
    `Deploy | ${
      contract.address
    } | ${contractName} | ${receipt.gasUsed.toString()} gas`,
  )
  return { contract, receipt }
}

const ArgumentParser = require('argparse').ArgumentParser
const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse example',
})
// TODO: add argument for protocol version
parser.addArgument(['-e', '--exit-on-success'], {
  help: 'use to close ganache instance after successful deployment',
  action: 'storeTrue',
})
const args = parser.parseArgs()

// Set Deployer addresses and nonce

const unlockedAccounts = [
  ErasureV130.NMR.mainnet_deployer,
  ErasureV130.DAI.mainnet_deployer,
  ErasureV130.UniswapFactory.mainnet,
]

const ganacheConfig = {
  port: 8545,
  host: '0.0.0.0',
  // db_path: '/data/ganache',
  unlocked_accounts: unlockedAccounts,
  default_balance_ether: 1000,
  total_accounts: 10,
  hardfork: 'constantinople',
  mnemonic:
    'myth like bonus scare over problem client lizard pioneer submit female collect',
}

let provider
if (args.exit_on_success) {
  console.log('provider')
  provider = new ethers.providers.Web3Provider(ganache.provider(ganacheConfig))
} else {
  console.log('server')
  const server = ganache.server(ganacheConfig)
  server.listen('8545')
  provider = new ethers.providers.JsonRpcProvider()
}

const main = async () => {
  process.on('unhandledRejection', function(error) {
    console.error(error)
    process.exit(1)
  })

  // use first account as deployer
  const deploySigner = provider.getSigner(0)
  // deploy external contracts to mainnet addresses
  await deployMocks()

  console.log(`\nDeploy Registries`)
  // Erasure_Users
  const Erasure_Users = (await deployContract('Erasure_Users', deploySigner))
    .contract
  // Erasure_Posts
  const Erasure_Posts = (await deployContract('Erasure_Posts', deploySigner))
    .contract
  // Erasure_Agreements
  const Erasure_Agreements = (
    await deployContract('Erasure_Agreements', deploySigner)
  ).contract
  // Erasure_Escrows
  const Erasure_Escrows = (
    await deployContract('Erasure_Escrows', deploySigner)
  ).contract

  console.log(`\nDeploy RegistryManager`)
  // RegistryManager
  const RegistryManager = (
    await deployContract('RegistryManager', deploySigner)
  ).contract

  console.log(`\nTransfer registry ownership`)
  // Erasure_Posts
  await Erasure_Posts.transferOwnership(RegistryManager.address)
  // Erasure_Agreements
  await Erasure_Agreements.transferOwnership(RegistryManager.address)
  // Erasure_Escrows
  await Erasure_Escrows.transferOwnership(RegistryManager.address)

  console.log(`\nDeploy Factories`)
  // Feed_Factory
  const Feed_Factory = (
    await deployFactory('Feed', Erasure_Posts, RegistryManager, deploySigner)
  ).factory
  // SimpleGriefing_Factory
  const SimpleGriefing_Factory = (
    await deployFactory(
      'SimpleGriefing',
      Erasure_Agreements,
      RegistryManager,
      deploySigner,
    )
  ).factory
  // CountdownGriefing_Factory
  const CountdownGriefing_Factory = (
    await deployFactory(
      'CountdownGriefing',
      Erasure_Agreements,
      RegistryManager,
      deploySigner,
    )
  ).factory
  // CountdownGriefingEscrow_Factory
  const CountdownGriefingEscrow_Factory = (
    await deployFactory(
      'CountdownGriefingEscrow',
      Erasure_Escrows,
      RegistryManager,
      deploySigner,
      ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [CountdownGriefing_Factory.address],
      ),
    )
  ).factory

  console.log(`\nWriting new subgraph config`)
  if (!args.exit_on_success) {
    fs.writeFileSync(
      '/data/config.json',
      JSON.stringify({
        network: 'mainnet',
        FeedFactory: Feed_Factory.address,
        SimpleGriefingFactory: SimpleGriefing_Factory.address,
        CountdownGriefingFactory: CountdownGriefing_Factory.address,
        CountdownGriefingEscrowFactory: CountdownGriefingEscrow_Factory.address,
      }),
    )
  }

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
  console.log('mockData', mockData)

  // Feed
  await createInstance('Feed', Feed_Factory, [
    mockData.userAddress,
    mockData.metadata,
  ])
  // SimpleGriefing
  await createInstance('SimpleGriefing', SimpleGriefing_Factory, [
    mockData.userAddress,
    mockData.userAddress,
    mockData.userAddress,
    constants.TOKEN_TYPES.NMR,
    ethers.utils.parseEther('1'),
    constants.RATIO_TYPES.Dec,
    mockData.metadata,
  ])
  // CountdownGriefing
  await createInstance('CountdownGriefing', CountdownGriefing_Factory, [
    mockData.userAddress,
    mockData.userAddress,
    mockData.userAddress,
    constants.TOKEN_TYPES.NMR,
    ethers.utils.parseEther('1'),
    constants.RATIO_TYPES.Dec,
    100000000,
    mockData.metadata,
  ])
  // CountdownGriefingEscrow
  await createInstance(
    'CountdownGriefingEscrow',
    CountdownGriefingEscrow_Factory,
    [
      mockData.userAddress,
      mockData.userAddress,
      mockData.userAddress,
      constants.TOKEN_TYPES.NMR,
      ethers.utils.parseEther('1'),
      ethers.utils.parseEther('1'),
      100000000,
      mockData.metadata,
      ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint8', 'uint256'],
        [ethers.utils.parseEther('1'), constants.RATIO_TYPES.Dec, 100000000],
      ),
    ],
  )

  if (args.exit_on_success) process.exit(0)
}

const deployMocks = async () => {
  console.log(`\nDistribute ETH to deployment wallets`)
  await sendEthToUnlockedAccounts()

  console.log(`\nDeploy UniswapFactory`)
  const UniswapFactory = await deployUniswapFactory()

  console.log(`\nDeploy NMR`)
  await deployToken('NMR', UniswapFactory)

  console.log(`\nDeploy DAI`)
  await deployToken('DAI', UniswapFactory)
}

const deployUniswapFactory = async () => {
  const deploySigner = provider.getSigner(0)
  const { contract } = await deployContract('UniswapFactory', deploySigner)
  return contract
}

const deployToken = async (tokenName, UniswapFactory) => {
  // deploy token
  const token = await deployAtAddress(tokenName)
  // deploy exchange
  const exchangeName = tokenName.concat('_Uniswap')
  const exchange = await deployAtAddress(exchangeName, [
    ErasureV130[tokenName].mainnet,
    UniswapFactory.address,
  ])
  // register exchange
  await UniswapFactory.createExchange(token.address, exchange.address)
  // add liquidity
  const signer = provider.getSigner(9)
  const tokenSigner = token.connect(signer)
  const exchangeSigner = exchange.connect(signer)
  const tokenAmount = ethers.utils.parseEther('1000')
  const ethAmount = ethers.utils.parseEther('100')
  const deadline =
    (await provider.getBlock(await provider.getBlockNumber())).timestamp + 6000
  await tokenSigner.mintMockTokens(await signer.getAddress(), tokenAmount)
  await tokenSigner.approve(exchange.address, tokenAmount)
  await exchangeSigner.addLiquidity(0, tokenAmount, deadline, {
    value: ethAmount,
    gasLimit: 1000000,
  })
}

const deployAtAddress = async (contractName, params = []) => {
  const signer = provider.getSigner(ErasureV130[contractName].mainnet_deployer)
  await increaseNonceTo(signer, ErasureV130[contractName].mainnet_nonce)
  const { contract } = await deployContract(contractName, signer, params)
  assert.equal(contract.address, ErasureV130[contractName].mainnet)
  return contract
}

const increaseNonceTo = async (signer, nonce = 1) => {
  console.log(`Incrementing nonce...`)
  const address = await signer.getAddress()
  let index = await provider.getTransactionCount(address)
  while (index < nonce) {
    await (await signer.sendTransaction({ to: address })).wait()
    ++index
  }
}

const sendEthToUnlockedAccounts = async () => {
  // send 10 ETH to each contract deployer
  const defaultSigner = provider.getSigner(9)
  // console.log(await defaultSigner.getAddress())
  await asyncForEach(unlockedAccounts, async address => {
    await defaultSigner.sendTransaction({
      to: address,
      value: ethers.utils.parseEther('10'),
    })
  })
}

const deployFactory = async (
  contractName,
  registry,
  RegistryManager,
  signer,
  factoryData = '0x0',
) => {
  // deploy template
  const template = (await deployContract(contractName, signer)).contract
  // deploy factory
  const factory = (
    await deployContract(contractName.concat('_Factory'), signer, [
      registry.address,
      template.address,
    ])
  ).contract
  // register factory
  await RegistryManager.addFactory(
    registry.address,
    factory.address,
    factoryData,
  )
  // validate token addresses
  assert.equal(
    await template.getTokenAddress(constants.TOKEN_TYPES.NMR),
    ErasureV130.NMR.mainnet,
  )
  assert.equal(
    await template.getTokenAddress(constants.TOKEN_TYPES.DAI),
    ErasureV130.DAI.mainnet,
  )
  return { template, factory }
}

const createInstance = async (templateName, factory, params) => {
  // get calldata
  const calldata = encodeCreateCall(
    ErasureV130[templateName].artifact.abi,
    params,
  )
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

main()
