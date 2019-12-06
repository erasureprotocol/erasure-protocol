const { setupDeployment } = require('./helpers/setup')

before(async () => {
  ;[this.deployer, this.MockNMR] = await setupDeployment()
})
