const ethers = require('ethers')
const { createDeployer } = require('../helpers/setup')
const { hexlify } = require('../helpers/utils')
const RegistryArtifact = require('../../build/Registry.json')

describe('Registry', function() {
  const instanceType = 'TestRegistry'
  const factoryExtraData = 'FACTORY_EXTRA_DATA'

  const FACTORY_STATUS = {
    Unregistered: 0,
    Registered: 1,
    Retired: 2,
  }

  // wallets and addresses
  let [ownerWallet, buyerWallet, sellerWallet] = accounts
  let owner = ownerWallet.signer.signingKey.address // normalize address
  const buyer = buyerWallet.signer.signingKey.address // normalize address
  const seller = sellerWallet.signer.signingKey.address // normalize address
  // nonce used to generate random address
  let factoryNonce = 0

  // tracks local factory addresses to compare against blockchain
  let factories = []
  let factoryStatuses = {}

  const generateRandomAddress = () => {
    // a factory address is just a hash generated from a nonce
    const hexdigest = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(factoryNonce.toString()),
    )

    const addr = '0x' + hexdigest.slice(12).substring(14)
    factoryNonce++
    return ethers.utils.getAddress(addr) // normalize the address
  }

  // create a local factory address stored in factories array and factoryStatuses is updated
  const addLocalFactory = factoryAddress => {
    const factoryId = factories.push(factoryAddress) - 1
    factoryStatuses[factoryAddress] = FACTORY_STATUS.Registered
    return factoryId
  }

  const retireLocalFactory = factoryAddress => {
    factoryStatuses[factoryAddress] = FACTORY_STATUS.Retired
  }

  const validateFactory = async (factoryId, factoryAddress) => {
    const factoryStatus = factoryStatuses[factoryAddress]

    // Registry.getFactoryID
    let actualFactoryId = await this.Registry.getFactoryID(factoryAddress)
    assert.equal(actualFactoryId, factoryId)

    // Registry.getFactoryStatus = Registered
    let actualFactoryStatus = await this.Registry.getFactoryStatus(
      factoryAddress,
    )
    assert.equal(actualFactoryStatus, factoryStatus)

    // Registry.getExtraData
    let actualExtraData = await this.Registry.getFactoryData(factoryAddress)
    assert.equal(actualExtraData, hexlify(factoryExtraData))

    // Registry.getFactory
    ;[
      actualFactoryStatus,
      actualFactoryId,
      actualExtraData,
    ] = await this.Registry.getFactory(factoryAddress)
    assert.equal(actualFactoryStatus, factoryStatus)
    assert.equal(actualFactoryId, factoryId)
    assert.equal(actualExtraData, hexlify(factoryExtraData))
  }

  let deployer
  before(async () => {
    deployer = await createDeployer()
    ownerWallet = deployer
    owner = ownerWallet.signer.signingKey.address
  })

  describe('Registry.constructor', () => {
    it('should deploy correctly', async () => {
      this.Registry = await deployer.deploy(
        RegistryArtifact,
        false,
        instanceType,
      )

      const actualInstanceType = await this.Registry.getInstanceType()

      // _instanceType stored as bytes4
      const instanceTypeHash = ethers.utils.hexDataSlice(
        ethers.utils.keccak256(Buffer.from(instanceType)),
        0,
        4,
      )
      assert.equal(actualInstanceType, instanceTypeHash)
    })
  })

  // Factory state functions

  describe('Registry.addFactory', () => {
    const factoryAddress = generateRandomAddress()

    it('should revert when not owner', async () => {
      await assert.revertWith(
        this.Registry.from(seller).addFactory(
          factoryAddress,
          Buffer.from(factoryExtraData),
        ),
        'Ownable: caller is not the owner',
      )
    })

    it('should add factory correctly', async () => {
      const txn = await this.Registry.addFactory(
        factoryAddress,
        Buffer.from(factoryExtraData),
      )

      await assert.emit(txn, 'FactoryAdded')
      await assert.emitWithArgs(txn, 'FactoryAdded', [
        owner,
        factoryAddress,
        0,
        hexlify(factoryExtraData),
      ])

      const factoryId = addLocalFactory(factoryAddress)

      validateFactory(factoryId, factoryAddress)
    })

    it('should revert when factory already added', async () => {
      await assert.revertWith(
        this.Registry.addFactory(factoryAddress, Buffer.from(factoryExtraData)),
        'factory already exists at the provided factory address',
      )
    })

    it('should revert when factory is retired', async () => {
      // retire the added factory
      await this.Registry.retireFactory(factoryAddress)
      retireLocalFactory(factoryAddress)

      await assert.revertWith(
        this.Registry.addFactory(
          factoryAddress,
          Buffer.from(factoryExtraData),
          { gasLimit: 30000 },
        ),
        'factory already exists at the provided factory address',
      )
    })
  })

  describe('Registry.retireFactory', () => {
    const factoryAddress = generateRandomAddress()

    it('should revert when not owner', async () => {
      await assert.revertWith(
        this.Registry.from(seller).retireFactory(factoryAddress),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert when factory is not added', async () => {
      await assert.revertWith(
        this.Registry.retireFactory(factoryAddress),
        'factory is not currently registered',
      )
    })

    it('should revert when factory is already retired', async () => {
      await this.Registry.addFactory(
        factoryAddress,
        Buffer.from(factoryExtraData),
      )
      addLocalFactory(factoryAddress)

      await this.Registry.retireFactory(factoryAddress)
      retireLocalFactory(factoryAddress)

      await assert.revertWith(
        this.Registry.retireFactory(factoryAddress),
        'factory is not currently registered',
      )
    })

    it('should retire factory correctly', async () => {
      const factoryAddress = generateRandomAddress()

      await this.Registry.addFactory(
        factoryAddress,
        Buffer.from(factoryExtraData),
      )
      const factoryId = addLocalFactory(factoryAddress)

      const txn = await this.Registry.retireFactory(factoryAddress)
      retireLocalFactory(factoryAddress)

      assert.emit(txn, 'FactoryRetired')
      assert.emitWithArgs(txn, 'FactoryRetired', [
        owner,
        factoryAddress,
        factoryId,
      ])

      const actualStatus = await this.Registry.getFactoryStatus(factoryAddress)
      assert.equal(actualStatus, FACTORY_STATUS.Retired)
    })
  })

  // Factory view functions

  describe('Registry.getFactoryCount', () => {
    it('should get factory count correctly', async () => {
      const populateCount = 5

      for (let i = 0; i < populateCount; i++) {
        const factoryAddress = generateRandomAddress()
        await this.Registry.addFactory(
          factoryAddress,
          Buffer.from(factoryExtraData),
        )

        addLocalFactory(factoryAddress)
      }

      const factoryCount = await this.Registry.getFactoryCount()
      assert.equal(factoryCount.toNumber(), factories.length)
    })
  })

  describe('Registry.getFactory', () => {
    it('gets factory correctly', async () => {
      for (let factoryId = 0; factoryId < factories.length; factoryId++) {
        const factoryAddress = factories[factoryId]

        await validateFactory(factoryId, factoryAddress)
      }
    })
  })

  describe('Registry.getFactoryAddress', () => {
    it('gets factory address correctly', async () => {
      for (let factoryId = 0; factoryId < factories.length; factoryId++) {
        const factoryAddress = factories[factoryId]
        const actualFactoryAddress = await this.Registry.getFactoryAddress(
          factoryId,
        )
        assert.equal(factoryAddress, actualFactoryAddress)
      }
    })
  })

  describe('Registry.getFactories', () => {
    it('should get factories correctly', async () => {
      const actualFactories = await this.Registry.getFactories()
      assert.deepEqual(actualFactories, factories)
    })
  })

  describe('Registry.getPaginatedFactories', () => {
    it('should revert when startIndex >= endIndex', async () => {
      await assert.revertWith(
        this.Registry.getPaginatedFactories(3, 2),
        'startIndex must be less than endIndex',
      )
    })

    it('should revert when endIndex > instances.length', async () => {
      await assert.revertWith(
        this.Registry.getPaginatedFactories(
          factories.length - 1,
          factories.length + 1,
        ),
        'end index out of range',
      )
    })

    it('should get paginated instances correctly', async () => {
      let startIndex = 0
      let endIndex = 3
      let actualFactories = await this.Registry.getPaginatedFactories(
        startIndex,
        endIndex,
      )
      assert.deepEqual(actualFactories, factories.slice(startIndex, endIndex)) // deepEqual because array comparison

      startIndex = 3
      endIndex = 5
      actualFactories = await this.Registry.getPaginatedFactories(
        startIndex,
        endIndex,
      )
      assert.deepEqual(actualFactories, factories.slice(startIndex, endIndex)) // deepEqual because array comparison
    })
  })

  // Instance state functions

  const instanceExtraData = 0

  let instances = []

  const addLocalInstance = instanceAddress => {
    const instanceIndex = instances.push(instanceAddress) - 1
    return instanceIndex
  }

  describe('Registry.register', () => {
    // pretend that the buyer address is one of the factory
    const factoryAddress = buyer

    it('should revert when factory not added', async () => {
      const instanceAddress = generateRandomAddress()

      await assert.revertWith(
        this.Registry.from(factoryAddress).register(
          instanceAddress,
          buyer,
          instanceExtraData,
        ),
        'factory in wrong status',
      )
    })

    it('should revert when factory is retired', async () => {
      const factoryAddress = seller

      await this.Registry.addFactory(seller, Buffer.from(factoryExtraData))
      await this.Registry.retireFactory(seller)

      addLocalFactory(factoryAddress)

      const instanceAddress = generateRandomAddress()

      await assert.revertWith(
        this.Registry.from(factoryAddress).register(
          instanceAddress,
          seller,
          instanceExtraData,
        ),
        'factory in wrong status',
      )
    })

    it('should register instance correctly', async () => {
      await this.Registry.addFactory(
        factoryAddress,
        Buffer.from(factoryExtraData),
      )
      const factoryId = addLocalFactory(factoryAddress)

      const instanceAddress = generateRandomAddress()

      const txn = await this.Registry.from(factoryAddress).register(
        instanceAddress,
        seller,
        instanceExtraData,
      )

      const instanceIndex = addLocalInstance(instanceAddress)

      await assert.emit(txn, 'InstanceRegistered')
      await assert.emitWithArgs(txn, 'InstanceRegistered', [
        instanceAddress,
        factoryAddress,
        seller,
        instanceIndex,
        factoryId,
      ])
    })
  })

  describe('Registry.getInstanceCount', () => {
    const factoryAddress = buyer

    it('should get instance count correctly', async () => {
      const populateCount = 5

      for (let i = 0; i < populateCount; i++) {
        const instanceAddress = generateRandomAddress()

        await this.Registry.from(factoryAddress).register(
          instanceAddress,
          buyer,
          instanceExtraData,
        )
        addLocalInstance(instanceAddress)
      }

      const instanceCount = await this.Registry.getInstanceCount()
      assert.equal(instanceCount, instances.length)
    })
  })

  describe('Registry.getInstance', () => {
    it('should revert when out of range', async () => {
      await assert.revertWith(
        this.Registry.getInstance(instances.length + 1),
        'index out of range',
      )
    })

    it('should get instance correctly', async () => {
      for (let i = 0; i < instances.length; i++) {
        const instanceAddress = await this.Registry.getInstance(i)
        assert.equal(instanceAddress, instances[i])
      }
    })
  })

  describe('Registry.getInstanceData', () => {
    const factoryAddress = buyer

    it('should revert when out of range', async () => {
      await assert.revertWith(
        this.Registry.getInstanceData(instances.length + 1),
        'index out of range',
      )
    })

    it('should get instance data correctly', async () => {
      const factoryID = factories.indexOf(factoryAddress)

      for (let i = 0; i < instances.length; i++) {
        const [
          instanceAddress,
          actualFactoryID,
          extraData,
        ] = await this.Registry.getInstanceData(i)
        assert.equal(instanceAddress, instances[i])
        assert.equal(actualFactoryID, factoryID)
        assert.equal(extraData.toNumber(), instanceExtraData)
      }
    })
  })

  describe('Registry.getInstances', () => {
    it('should get instances correctly', async () => {
      const actualInstances = await this.Registry.getInstances()
      assert.deepEqual(actualInstances, instances)
    })
  })

  describe('Registry.getPaginatedInstances', () => {
    it('should revert when startIndex >= endIndex', async () => {
      await assert.revertWith(
        this.Registry.getPaginatedInstances(3, 2),
        'startIndex must be less than endIndex',
      )
    })

    it('should revert when endIndex > instances.length', async () => {
      await assert.revertWith(
        this.Registry.getPaginatedInstances(
          instances.length - 1,
          instances.length + 1,
        ),
        'end index out of range',
      )
    })

    it('should get paginated instances correctly', async () => {
      let startIndex = 0
      let endIndex = 3
      let actualInstances = await this.Registry.getPaginatedInstances(
        startIndex,
        endIndex,
      )
      assert.deepEqual(actualInstances, instances.slice(startIndex, endIndex)) // deepEqual because array comparison

      startIndex = 3
      endIndex = 5
      actualInstances = await this.Registry.getPaginatedInstances(
        startIndex,
        endIndex,
      )
      assert.deepEqual(actualInstances, instances.slice(startIndex, endIndex)) // deepEqual because array comparison
    })
  })
})
