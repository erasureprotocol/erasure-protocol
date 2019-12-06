const etherlime = require('etherlime-lib')
const ethers = require('ethers')

const nmrAddress = '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671'
const nmrDeployAddress = '0x9608010323ed882a38ede9211d7691102b4f0ba0'

function createDeployer() {
  return new etherlime.EtherlimeGanacheDeployer(
    accounts[accounts.length - 1].secretKey,
  )
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
  const MockNMR_artifact = require('../../build/MockNMR.json')

  const deployer = createDeployer()

  await deployer.signer.sendTransaction({
    to: nmrDeployAddress,
    value: ethers.utils.parseEther('1'),
  })

  const nmr_deployer = createDeployer()
  nmr_deployer.signer = nmr_deployer.provider.getSigner(nmrDeployAddress)

  await increaseNonce(nmr_deployer.signer, 1)

  const contract = await nmr_deployer.deploy(MockNMR_artifact)

  assert.equal(contract.contractAddress, nmrAddress)

  return [deployer, contract]
}

async function initDeployment() {
  const MockNMR_artifact = require('../../build/MockNMR.json')
  const deployer = createDeployer()
  const MockNMR = deployer.wrapDeployedContract(MockNMR_artifact, nmrAddress)
  return [deployer, MockNMR]
}

module.exports = {
  setupDeployment,
  initDeployment,
  createDeployer,
}
