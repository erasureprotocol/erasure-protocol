const { createDeployer } = require('../helpers/setup')

describe('Countdown', function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2],
  }

  let contracts = {
    TestCountdown: {
      artifact: require('../../build/TestCountdown.json'),
    },
  }

  let deployer
  before(() => {
    deployer = createDeployer()
  })

  beforeEach(async () => {
    contracts.TestCountdown.instance = await deployer.deploy(
      contracts.TestCountdown.artifact,
    )
  })

  describe('Deadline._setDeadline', () => {
    it('sets deadline correctly', async () => {
      const date = new Date()
      const timestamp = Math.round(date.getTime() / 1000)

      const txn = await contracts.TestCountdown.instance.setDeadline(timestamp)
      await assert.emit(txn, 'DeadlineSet')
      await assert.emitWithArgs(txn, 'DeadlineSet', [timestamp])

      const actualDeadline = await contracts.TestCountdown.instance.getDeadline()
      assert.equal(actualDeadline, timestamp)
    })
  })

  describe('Deadline.getDeadline', () => {
    it('gets deadline as 0 when deadline not set', async () => {
      const deadline = await contracts.TestCountdown.instance.getDeadline()
      assert.equal(deadline, 0)
    })
  })

  describe('Deadline.getDeadlineStatus', () => {
    it('should be 0 when deadline not set', async () => {
      const getDeadlineStatus = await contracts.TestCountdown.instance.getDeadlineStatus()
      assert.equal(getDeadlineStatus, 0)
      const getTimeRemaining = await contracts.TestCountdown.instance.getTimeRemaining()
      assert.equal(getTimeRemaining, 0)
    })

    it('should be 1 when deadline set', async () => {
      const block = await deployer.provider.getBlock('latest')
      const blockTimestamp = block.timestamp

      // set deadline
      await contracts.TestCountdown.instance.setDeadline(blockTimestamp + 1000)

      const getDeadlineStatus = await contracts.TestCountdown.instance.getDeadlineStatus()
      assert.equal(getDeadlineStatus, 1)
      const getTimeRemaining = await contracts.TestCountdown.instance.getTimeRemaining()
      assert.equal(getTimeRemaining > 0, true)
    })

    it('should be 2 when deadline past', async () => {
      const block = await deployer.provider.getBlock('latest')
      const blockTimestamp = block.timestamp

      // set deadline
      await contracts.TestCountdown.instance.setDeadline(blockTimestamp + 1000)

      // time travel
      await utils.timeTravel(deployer.provider, 2000)

      const getDeadlineStatus = await contracts.TestCountdown.instance.getDeadlineStatus()
      assert.equal(getDeadlineStatus, 2)
      const getTimeRemaining = await contracts.TestCountdown.instance.getTimeRemaining()
      assert.equal(getTimeRemaining, 0)
    })
  })

  describe('Countdown._setLength', () => {
    it('sets length correctly', async () => {
      const length = 1000
      const txn = await contracts.TestCountdown.instance.setLength(length)
      await assert.emit(txn, 'LengthSet')
      await assert.emitWithArgs(txn, 'LengthSet', [length])

      const actualLength = await contracts.TestCountdown.instance.getLength()
      assert.equal(actualLength, length)
    })
  })

  describe('Countdown._start', () => {
    it('starts countdown when length not set', async () => {
      const txn = await contracts.TestCountdown.instance.start()
      await assert.emit(txn, 'DeadlineSet')
    })

    it('starts countdown when length=0', async () => {
      const length = 0
      await contracts.TestCountdown.instance.setLength(length)

      const txn = await contracts.TestCountdown.instance.start()
      await assert.emit(txn, 'DeadlineSet')
    })

    it('starts countdown correctly', async () => {
      const length = 1000
      await contracts.TestCountdown.instance.setLength(length)

      const txn = await contracts.TestCountdown.instance.start()
      await assert.emit(txn, 'DeadlineSet')
    })
  })

  describe('Countdown.getCountdownStatus', () => {
    it('should be 0 when length not set', async () => {
      // getCountdownStatus
      const getCountdownStatus = await contracts.TestCountdown.instance.getCountdownStatus()
      assert.equal(getCountdownStatus, 0)

      // getLength
      const getLength = await contracts.TestCountdown.instance.getLength()
      assert.equal(getLength, 0)
    })

    it('should be 1 when length set', async () => {
      const length = 2000

      // set length
      await contracts.TestCountdown.instance.setLength(length)

      // getCountdownStatus
      const getCountdownStatus = await contracts.TestCountdown.instance.getCountdownStatus()
      assert.equal(getCountdownStatus, 1)

      // getLength
      const getLength = await contracts.TestCountdown.instance.getLength()
      assert.equal(getLength, 2000)
    })

    it('should be 2 when countdown started', async () => {
      const length = 2000

      // set length
      await contracts.TestCountdown.instance.setLength(length)

      // start countdown
      await contracts.TestCountdown.instance.start()

      // getCountdownStatus
      const getCountdownStatus = await contracts.TestCountdown.instance.getCountdownStatus()
      assert.equal(getCountdownStatus, 2)

      // getLength
      const getLength = await contracts.TestCountdown.instance.getLength()
      assert.equal(getLength, 2000)
    })

    it('should be 3 when countdown over', async () => {
      const length = 2000

      // set length
      await contracts.TestCountdown.instance.setLength(length)

      // start countdown
      await contracts.TestCountdown.instance.start()

      // time travel
      await utils.timeTravel(deployer.provider, length)

      // getCountdownStatus
      const getCountdownStatus = await contracts.TestCountdown.instance.getCountdownStatus()
      assert.equal(getCountdownStatus, 3)

      // getLength
      const getLength = await contracts.TestCountdown.instance.getLength()
      assert.equal(getLength, 2000)
    })
  })
})
