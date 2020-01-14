const { setupDeployment } = require('./helpers/setup')

before(async function() {
  ;[
    deployer,
    contracts,
    NMR,
    DAI,
    UniswapNMR,
    UniswapDAI,
  ] = await setupDeployment()
})
