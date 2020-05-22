const { setupDeployment } = require('./helpers/setup')

before(async function() {
  ;[
    deployer,
    contracts,
    NMR,
    DAI,
    UniswapNMR,
    UniswapDAI,
    BurnRewards,
    MultiTokenRewards,
  ] = await setupDeployment()
})
