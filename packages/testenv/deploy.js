const ethers = require('ethers')
const assert = require('assert')
const ganache = require('ganache-cli')
const { hexlify, createIPFShash, abiEncodeWithSelector } = require('./utils')
const { RATIO_TYPES, TOKEN_TYPES } = require('./variables')

let c = {
  NMR: {
    token: {
      artifact: require('./build/MockNMR.json'),
    },
    uniswap: {
      artifact: require('./build/MockUniswapExchange.json'),
    },
  },
  DAI: {
    token: {
      artifact: require('./build/MockERC20.json'),
    },
    uniswap: {
      artifact: require('./build/MockUniswapExchange.json'),
    },
  },
  UniswapFactory: {
    artifact: require('./build/MockUniswapFactory.json'),
  },
  Authereum: {
    artifact: require('./build/MockAuthereum.json'),
  },
  RegistryManager: {
    artifact: require('./build/RegistryManager.json'),
  },
  Erasure_Users: {
    artifact: require('./build/Erasure_Users.json'),
  },
  Erasure_Agreements: {
    artifact: require('./build/Erasure_Agreements.json'),
  },
  Erasure_Posts: {
    artifact: require('./build/Erasure_Posts.json'),
  },
  Erasure_Escrows: {
    artifact: require('./build/Erasure_Escrows.json'),
  },
  SimpleGriefing: {
    factory: {
      artifact: require('./build/SimpleGriefing_Factory.json'),
    },
    template: {
      artifact: require('./build/SimpleGriefing.json'),
    },
  },
  CountdownGriefing: {
    factory: {
      artifact: require('./build/CountdownGriefing_Factory.json'),
    },
    template: {
      artifact: require('./build/CountdownGriefing.json'),
    },
  },
  CountdownGriefingEscrow: {
    factory: {
      artifact: require('./build/CountdownGriefingEscrow_Factory.json'),
    },
    template: {
      artifact: require('./build/CountdownGriefingEscrow.json'),
    },
  },
  Feed: {
    factory: {
      artifact: require('./build/Feed_Factory.json'),
    },
    template: {
      artifact: require('./build/Feed.json'),
    },
  },
}

var ArgumentParser = require('argparse').ArgumentParser
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Argparse example',
})
parser.addArgument(['-e', '--exit-on-success'], {
  help: 'use to close ganache instance after successful deployment',
  action: 'storeTrue',
})
var args = parser.parseArgs()

// Deployer addresses
const nmrDeployAddress = '0x9608010323ed882a38ede9211d7691102b4f0ba0'
const daiDeployAddress = '0xb5b06a16621616875A6C2637948bF98eA57c58fa'
const uniswapFactoryAddress = '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'

// Contract addresses
const nmrTokenAddress = '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'
const nmrUniswapAddress = '0x2Bf5A5bA29E60682fC56B2Fcf9cE07Bef4F6196f'
const daiTokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const daiUniswapAddress = '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667'

const unlocked_accounts = [
  nmrDeployAddress,
  daiDeployAddress,
  uniswapFactoryAddress,
]

let ganacheConfig = {
  port: 8545,
  host: '0.0.0.0',
  unlocked_accounts: unlocked_accounts,
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
  // console.log(provider);
  // console.log(await provider.listAccounts());

  const deploySigner = provider.getSigner(0)
  // console.log(await deploySigner.getAddress())

  console.log(`Deploy Mock Contracts`)

  await deployMocks()

  console.log(`Deploy Registries`)
  ;[c.Erasure_Users.wrap, _] = await deployContract(
    'Erasure_Users',
    c.Erasure_Users.artifact,
    [],
    deploySigner,
  )
  ;[c.Erasure_Posts.wrap, _] = await deployContract(
    'Erasure_Posts',
    c.Erasure_Posts.artifact,
    [],
    deploySigner,
  )
  ;[c.Erasure_Agreements.wrap, _] = await deployContract(
    'Erasure_Agreements',
    c.Erasure_Agreements.artifact,
    [],
    deploySigner,
  )
  ;[c.Erasure_Escrows.wrap, _] = await deployContract(
    'Erasure_Escrows',
    c.Erasure_Escrows.artifact,
    [],
    deploySigner,
  )

  console.log(`Deploy RegistryManager and transfer ownership`)
  ;[c.RegistryManager.wrap, _] = await deployContract(
    'RegistryManager',
    c.RegistryManager.artifact,
    [],
    deploySigner,
  )

  await c.Erasure_Posts.wrap.transferOwnership(c.RegistryManager.wrap.address)
  await c.Erasure_Agreements.wrap.transferOwnership(
    c.RegistryManager.wrap.address,
  )
  await c.Erasure_Escrows.wrap.transferOwnership(c.RegistryManager.wrap.address)

  console.log(`Deploy Factories`)
  ;[
    c.SimpleGriefing.template.wrap,
    c.SimpleGriefing.factory.wrap,
  ] = await deployFactory(
    'SimpleGriefing',
    c.Erasure_Agreements.wrap,
    deploySigner,
  )
  assert.equal(
    await c.SimpleGriefing.template.wrap.getTokenAddress(TOKEN_TYPES.NMR),
    nmrTokenAddress,
  )
  assert.equal(
    await c.SimpleGriefing.template.wrap.getTokenAddress(TOKEN_TYPES.DAI),
    daiTokenAddress,
  )
  ;[
    c.CountdownGriefing.template.wrap,
    c.CountdownGriefing.factory.wrap,
  ] = await deployFactory(
    'CountdownGriefing',
    c.Erasure_Agreements.wrap,
    deploySigner,
  )
  assert.equal(
    await c.CountdownGriefing.template.wrap.getTokenAddress(TOKEN_TYPES.NMR),
    nmrTokenAddress,
  )
  assert.equal(
    await c.CountdownGriefing.template.wrap.getTokenAddress(TOKEN_TYPES.DAI),
    daiTokenAddress,
  )
  ;[c.Feed.template.wrap, c.Feed.factory.wrap] = await deployFactory(
    'Feed',
    c.Erasure_Posts.wrap,
    deploySigner,
  )
  assert.equal(
    await c.Feed.template.wrap.getTokenAddress(TOKEN_TYPES.NMR),
    nmrTokenAddress,
  )
  assert.equal(
    await c.Feed.template.wrap.getTokenAddress(TOKEN_TYPES.DAI),
    daiTokenAddress,
  )

  const abiEncoder = new ethers.utils.AbiCoder()
  const agreementFactory = abiEncoder.encode(
    ['address'],
    [c.CountdownGriefing.factory.wrap.address],
  )

  ;[
    c.CountdownGriefingEscrow.template.wrap,
    c.CountdownGriefingEscrow.factory.wrap,
  ] = await deployFactory(
    'CountdownGriefingEscrow',
    c.Erasure_Escrows.wrap,
    deploySigner,
    agreementFactory,
  )

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

  if (args.exit_on_success) process.exit(0)
}

async function deployer(artifact, params, signer) {
  const factory = new ethers.ContractFactory(
    artifact.compilerOutput.abi,
    artifact.compilerOutput.evm.bytecode.object,
    signer,
  )
  const contract = await factory.deploy(...params)
  const receipt = await provider.getTransactionReceipt(
    contract.deployTransaction.hash,
  )
  return [contract, receipt]
}

async function deployContract(contractName, artifact, params, signer) {
  const [contract, receipt] = await deployer(artifact, params, signer)
  console.log(
    `Deploy | ${
      contract.address
    } | ${contractName} | ${receipt.gasUsed.toString()} gas`,
  )
  return [contract, receipt]
}

async function deployMocks() {
  console.log(`Distribute ETH to deployment wallets`)
  await sendEthToUnlockedAccounts()

  console.log(`Deploy UniswapFactory`)
  UniswapFactory = await deployUniswapFactory()

  console.log(`Deploy NMR`)
  await deployNMR(UniswapFactory)

  console.log(`Deploy DAI`)
  await deployDAI(UniswapFactory)

  console.log(`Deploy Authereum`)
  // await deployAuthereum()
}

async function deployUniswapFactory() {
  const deploySigner = provider.getSigner(0)
  const [UniswapFactory] = await deployContract(
    'UniswapFactory',
    c.UniswapFactory.artifact,
    [],
    deploySigner,
  )
  return UniswapFactory
}

async function deployNMR(UniswapFactory) {
  let nmrSigner = provider.getSigner(nmrDeployAddress)
  // console.log(await nmrSigner.getAddress())

  // needs to increment the nonce to 1
  await nmrSigner.sendTransaction({ to: nmrSigner.address })

  // deploy mock token
  ;[c.NMR.token.wrap, _] = await deployContract(
    'NMR',
    c.NMR.token.artifact,
    [],
    nmrSigner,
  )
  assert.equal(c.NMR.token.wrap.address, nmrTokenAddress)

  let uniswapSigner = provider.getSigner(uniswapFactoryAddress)
  // console.log(await uniswapSigner.getAddress())

  // needs to increment the nonce to 41
  for (
    let index = await provider.getTransactionCount(uniswapFactoryAddress);
    index < 41;
    index++
  ) {
    await uniswapSigner.sendTransaction({ to: uniswapSigner.address })
  }

  // deploy mock uniswap
  ;[c.NMR.uniswap.wrap, _] = await deployContract(
    'NMR',
    c.NMR.uniswap.artifact,
    [nmrTokenAddress, UniswapFactory.address],
    uniswapSigner,
  )
  assert.equal(c.NMR.uniswap.wrap.address, nmrUniswapAddress)
}

async function deployDAI(UniswapFactory) {
  let daiSigner = provider.getSigner(daiDeployAddress)
  // console.log(await daiSigner.getAddress())

  // needs to increment the nonce to 1
  await daiSigner.sendTransaction({ to: daiSigner.address })

  // deploy mock token
  ;[c.DAI.token.wrap, _] = await deployContract(
    'DAI',
    c.DAI.token.artifact,
    [],
    daiSigner,
  )
  assert.equal(c.DAI.token.wrap.address, daiTokenAddress)

  let uniswapSigner = provider.getSigner(uniswapFactoryAddress)
  // console.log(await uniswapSigner.getAddress())

  // needs to increment the nonce to 1225
  for (
    let index = await provider.getTransactionCount(uniswapFactoryAddress);
    index < 1225;
    index++
  ) {
    await uniswapSigner.sendTransaction({ to: uniswapSigner.address })
  }

  // deploy mock uniswap
  ;[c.DAI.uniswap.wrap, _] = await deployContract(
    'DAI',
    c.DAI.uniswap.artifact,
    [daiTokenAddress, UniswapFactory.address],
    uniswapSigner,
  )
  assert.equal(c.DAI.uniswap.wrap.address, daiUniswapAddress)
}

const sendEthToUnlockedAccounts = async () => {
  // send 10 ETH to each contract deployer
  const defaultSigner = provider.getSigner(9)
  // console.log(await defaultSigner.getAddress())

  await asyncForEach(unlocked_accounts, async address => {
    await defaultSigner.sendTransaction({
      to: address,
      value: ethers.utils.parseEther('10'),
    })
  })
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function deployFactory(
  contractName,
  registry,
  signer,
  factoryData = '0x0',
) {
  let templateContract
  await deployer(c[contractName].template.artifact, [], signer).then(
    ([contract, receipt]) => {
      templateContract = contract
      console.log(
        `Deploy | ${
          contract.address
        } | ${contractName} | Template | ${receipt.gasUsed.toString()} gas`,
      )
    },
  )

  let factoryContract
  await deployer(
    c[contractName].factory.artifact,
    [registry.address, templateContract.address],
    signer,
  ).then(([contract, receipt]) => {
    factoryContract = contract
    console.log(
      `Deploy | ${
        contract.address
      } | ${contractName} | Factory | ${receipt.gasUsed.toString()} gas`,
    )
  })

  await c.RegistryManager.wrap
    .addFactory(registry.address, factoryContract.address, factoryData)
    .then(async tx => {
      const receipt = await provider.getTransactionReceipt(tx.hash)
      console.log(
        `addFactory() | ${contractName} | ${receipt.gasUsed.toString()} gas`,
      )
    })

  console.log(``)

  return [templateContract, factoryContract]
}

async function createInstance(name, calldata) {
  await c[name].factory.wrap.functions.create(calldata).then(async txn => {
    const receipt = await provider.getTransactionReceipt(txn.hash)
    console.log(`create()      | ${receipt.gasUsed.toString()} gas | ${name}`)
  })
  const testSalt = ethers.utils.formatBytes32String('testSalt')
  await c[name].factory.wrap.functions
    .createSalty(calldata, testSalt)
    .then(async txn => {
      const receipt = await provider.getTransactionReceipt(txn.hash)
      console.log(`createSalty() | ${receipt.gasUsed.toString()} gas | ${name}`)
    })
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

main(args)
