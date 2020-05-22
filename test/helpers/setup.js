const etherlime = require('etherlime-lib')
const ethers = require('ethers')
const ganache = require('ganache-cli')

const contracts = require('../../deployment/deploy_config')

function createDeployer() {
  const unlocked_accounts = [
    contracts.NMR.token.mainnet.deployer,
    contracts.DAI.token.mainnet.deployer,
    contracts.NMR.uniswap.mainnet.deployer,
  ]

  const ganache_config = {
    port: 8545,
    host: '0.0.0.0',
    unlocked_accounts: unlocked_accounts,
    default_balance_ether: 10000,
    total_accounts: 10,
    hardfork: 'constantinople',
    mnemonic:
      'myth like bonus scare over problem client lizard pioneer submit female collect',
  }

  const provider = new etherlime.EtherlimeGanacheDeployer()

  provider.setPrivateKey(accounts[accounts.length - 1].secretKey)
  provider.setProvider(
    new ethers.providers.Web3Provider(ganache.provider(ganache_config)),
  )

  return provider
}

async function increaseNonce(signer, increaseTo) {
  const currentNonce = await signer.getTransactionCount()
  if (currentNonce === increaseTo) {
    return
  }
  if (currentNonce > increaseTo) {
    throw new Error(
      `nonce is greater than desired value ${currentNonce} > ${increaseTo}`,
    )
  }

  for (let index = 0; index < increaseTo - currentNonce; index++) {
    const transaction = {
      to: signer.address, // just send to a random address, it doesn't really matter who
      value: 0,
    }
    await signer.sendTransaction(transaction)
  }
}

async function setupDeployment() {
  const deployer = createDeployer()

  if (
    deployer.signer.address !== '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e'
  ) {
    throw new Error(
      `Default deployer must be set. Try running 'yarn run test_setup'. Expected 0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e and got ${deployer.signer.address}.`,
    )
  }

  const UniswapFactory = await deployUniswapFactory(deployer)
  console.log(`UniswapFactory Deployed at ${UniswapFactory.contractAddress}`)

  const NMR = await deployToken(deployer, contracts.NMR.token)
  console.log(`NMR Deployed at ${NMR.contractAddress}`)

  const DAI = await deployToken(deployer, contracts.DAI.token)
  console.log(`DAI Deployed at ${DAI.contractAddress}`)

  const UniswapNMR = await deployUniswap(
    deployer,
    contracts.NMR.uniswap,
    NMR,
    UniswapFactory,
  )
  console.log(`UniswapNMR Deployed at ${UniswapNMR.contractAddress}`)

  const UniswapDAI = await deployUniswap(
    deployer,
    contracts.DAI.uniswap,
    DAI,
    UniswapFactory,
  )
  console.log(`UniswapDAI Deployed at ${UniswapDAI.contractAddress}`)

  deployer.setPrivateKey(accounts[accounts.length - 1].secretKey)

  const rewardRatio = 3
  const BurnRewards = await deployer.deploy(
    contracts.BurnRewards.artifact,
    false,
    rewardRatio,
  )

  const rewardAmount = ethers.utils.parseEther('1000000')
  await NMR.from(accounts[accounts.length - 1].signer.address).mintMockTokens(
    accounts[accounts.length - 1].signer.address,
    rewardAmount,
  )
  await NMR.from(accounts[accounts.length - 1].signer.address).transfer(
    BurnRewards.contractAddress,
    rewardAmount,
  )
  console.log(`BurnRewards Deployed at ${BurnRewards.contractAddress}`)

  const MultiTokenRewards = await deployer.deploy(
    contracts.MultiTokenRewards.artifact,
    false,
    BurnRewards.contractAddress,
  )
  console.log(
    `MultiTokenRewards Deployed at ${MultiTokenRewards.contractAddress}`,
  )

  const tokenAmount = ethers.utils.parseEther('10000')
  await NMR.mintMockTokens(accounts[0].signer.address, tokenAmount)
  await NMR.mintMockTokens(accounts[1].signer.address, tokenAmount)
  await NMR.mintMockTokens(accounts[2].signer.address, tokenAmount)
  await NMR.mintMockTokens(accounts[3].signer.address, tokenAmount)
  await NMR.mintMockTokens(accounts[4].signer.address, tokenAmount)

  console.log(`Deployment Completed`)

  return [
    deployer,
    contracts,
    NMR,
    DAI,
    UniswapNMR,
    UniswapDAI,
    BurnRewards,
    MultiTokenRewards,
  ]
}

async function deployUniswapFactory(deployer) {
  const UniswapFactory = await deployer.deploy(
    contracts.UniswapFactory.artifact,
  )

  return UniswapFactory
}

async function deployToken(deployer, contractObj) {
  // fund with eth
  deployer.setPrivateKey(accounts[accounts.length - 1].secretKey)
  await deployer.signer.sendTransaction({
    to: contractObj.mainnet.deployer,
    value: ethers.utils.parseEther('1'),
  })

  // update signer
  deployer.signer = deployer.provider.getSigner(contractObj.mainnet.deployer)
  // increment nonce
  await increaseNonce(deployer.signer, contractObj.mainnet.nonce)

  // deploy contract
  const contract = await deployer.deploy(contractObj.artifact)
  assert.equal(contract.contractAddress, contractObj.mainnet.address)

  // return contract
  return contract
}

async function deployUniswap(deployer, contractObj, token, UniswapFactory) {
  // fund with eth
  deployer.setPrivateKey(accounts[accounts.length - 1].secretKey)
  await deployer.signer.sendTransaction({
    to: contractObj.mainnet.deployer,
    value: ethers.utils.parseEther('1'),
  })

  // update signer
  deployer.signer = deployer.provider.getSigner(contractObj.mainnet.deployer)
  // increment nonce
  await increaseNonce(deployer.signer, contractObj.mainnet.nonce)

  // deploy exchange
  const contract = await deployer.deploy(
    contractObj.artifact,
    false,
    token.contractAddress,
    UniswapFactory.contractAddress,
  )
  assert.equal(contract.contractAddress, contractObj.mainnet.address)

  // add exchange to factory

  await UniswapFactory.createExchange(
    token.contractAddress,
    contract.contractAddress,
  )

  // add liquidity

  const account = accounts[accounts.length - 1]
  const signer = deployer.provider.getSigner(account.signer.address)

  const tokenAmount = ethers.utils.parseEther('1000')
  const ethAmount = ethers.utils.parseEther('100')
  const deadline =
    (await deployer.provider.getBlock(await deployer.provider.getBlockNumber()))
      .timestamp + 6000

  await token
    .from(account.signer.address)
    .mintMockTokens(account.signer.address, tokenAmount)
  await token
    .from(account.signer.address)
    .approve(contract.contractAddress, tokenAmount)

  await contract
    .from(account.signer.address)
    .addLiquidity(0, tokenAmount, deadline, {
      value: ethAmount,
    })

  // return contract
  return contract
}

module.exports = {
  setupDeployment,
}
