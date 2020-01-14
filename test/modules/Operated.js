describe('Operated', function() {
  const [operatorWallet, newOperatorWallet] = accounts
  const operator = operatorWallet.signer.signingKey.address
  const newOperator = newOperatorWallet.signer.signingKey.address

  let contracts = {
    TestOperated: {
      artifact: require('../../build/TestOperated.json'),
    },
  }

  beforeEach(async () => {
    contracts.TestOperated.instance = await deployer.deploy(
      contracts.TestOperated.artifact,
    )
  })

  // state functions

  describe('Operator._setOperator', () => {
    it('should setOperator correctly', async () => {
      const txn = await contracts.TestOperated.instance.setOperator(operator)
      await assert.emitWithArgs(txn, 'OperatorUpdated', [operator])

      const actualOperator = await contracts.TestOperated.instance.getOperator()
      assert.equal(actualOperator, operator)

      const isOperator = await contracts.TestOperated.instance.testIsOperator(
        operator,
      )
      assert.equal(isOperator, true)
    })

    it('should revert when operator already set', async () => {
      await contracts.TestOperated.instance.setOperator(operator)
      await assert.revertWith(
        contracts.TestOperated.instance.setOperator(operator),
        'operator already set',
      )
    })

    it('should revert when set to address 0', async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.setOperator(
          ethers.constants.AddressZero,
        ),
        'cannot set operator to address 0',
      )
    })
  })

  describe('Operator._transferOperator', () => {
    it('should transfer operator correctly', async () => {
      await contracts.TestOperated.instance.setOperator(operator)

      const txn = await contracts.TestOperated.instance.transferOperator(
        newOperator,
      )
      await assert.emitWithArgs(txn, 'OperatorUpdated', [newOperator])

      const actualOperator = await contracts.TestOperated.instance.getOperator()
      assert.equal(actualOperator, newOperator)

      const isOperator = await contracts.TestOperated.instance.testIsOperator(
        newOperator,
      )
      assert.equal(isOperator, true)
    })

    it('should revert when no operator was set', async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.transferOperator(newOperator),
        'only when operator set',
      )
    })

    it('should revert when transfer to address 0', async () => {
      await contracts.TestOperated.instance.setOperator(operator)
      await assert.revertWith(
        contracts.TestOperated.instance.transferOperator(
          ethers.constants.AddressZero,
        ),
        'cannot set operator to address 0',
      )
    })
  })

  describe('Operator._renounceOperator', () => {
    it('should renounce operator correctly', async () => {
      await contracts.TestOperated.instance.setOperator(operator)
      const txn = await contracts.TestOperated.instance.renounceOperator()
      await assert.emitWithArgs(txn, 'OperatorUpdated', [
        ethers.constants.AddressZero,
      ])

      const actualOperator = await contracts.TestOperated.instance.getOperator()
      assert.equal(actualOperator, ethers.constants.AddressZero)
    })

    it('should revert when no operator is set', async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.renounceOperator(),
        'only when operator set',
      )
    })
  })
})
