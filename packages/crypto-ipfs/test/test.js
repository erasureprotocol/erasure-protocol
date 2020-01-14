const assert = require('assert')
const isBase64 = require('is-base64')
const ErasureHelper = require('../index')

describe('multihash', () => {
  describe('test inputs', () => {
    it('should correctly parse a b58 multihash', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2',
        inputType: 'b58',
        outputType: 'hex',
      })
      assert.equal(
        hash,
        '0x1220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
      )
    })

    it('should correctly parse a hex multihash with 0x prefix', async () => {
      const hash = await ErasureHelper.multihash({
        input:
          '0x1220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
        inputType: 'hex',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2')
    })

    it('should correctly parse a hex multihash', async () => {
      const hash = await ErasureHelper.multihash({
        input:
          '1220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
        inputType: 'hex',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2')
    })

    it('should correctly parse a sha2-256 with 0x prefix', async () => {
      const hash = await ErasureHelper.multihash({
        input:
          '0x227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
        inputType: 'sha2-256',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2')
    })

    it('should correctly parse a sha2-256', async () => {
      const hash = await ErasureHelper.multihash({
        input:
          '227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
        inputType: 'sha2-256',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2')
    })

    it('should calculate the multihash of a string', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'Hello World!\n',
        inputType: 'raw',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmfM2r8seH2GiRaC4esTjeraXEachRt8ZsSeGaWTPLyMoG')
    })

    it('should calculate the multihash of a buffer', async () => {
      const hash = await ErasureHelper.multihash({
        input: Buffer.from('Hello World!\n'),
        inputType: 'raw',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmfM2r8seH2GiRaC4esTjeraXEachRt8ZsSeGaWTPLyMoG')
    })

    it('should calculate the multihash of a JSON', async () => {
      const hash = await ErasureHelper.multihash({
        input: JSON.stringify({ proofhash: 'hello' }),
        inputType: 'raw',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmbYQZq5qF6D4mfnB4ahpBqr8HfzyjJDcYk6cszRbNwkhs')
    })
  })

  describe('test outputs', () => {
    it('should output correct prefix', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2',
        inputType: 'b58',
        outputType: 'prefix',
      })
      assert.equal(hash, '0x1220')
    })

    it('should output correct digest', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2',
        inputType: 'b58',
        outputType: 'digest',
      })
      assert.equal(
        hash,
        '0x227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
      )
    })

    it('should output correct hex', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2',
        inputType: 'b58',
        outputType: 'hex',
      })
      assert.equal(
        hash,
        '0x1220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
      )
    })

    it('should output correct b58', async () => {
      const hash = await ErasureHelper.multihash({
        input: 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2',
        inputType: 'b58',
        outputType: 'b58',
      })
      assert.equal(hash, 'QmQfJQtxGA5MzWi5HZPyCaZiPAzNkxq8U9yApihkKsWZx2')
    })
  })
})

describe('encodeCreateCall', () => {
  it('should encode initialize function call', () => {
    const abi = [
      {
        constant: false,
        inputs: [
          {
            internalType: 'address',
            name: 'operator',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'metadata',
            type: 'bytes',
          },
        ],
        name: 'initialize',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ]
    const values = [
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      '0x1220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f',
    ]

    const call = ErasureHelper.encodeCreateCall(abi, values)

    assert.equal(
      call,
      '0xd1f578940000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000221220227e75ab3fb8ba90fbb7addb3d30bd20c676f873e0216a767084b2073e0b7d9f000000000000000000000000000000000000000000000000000000000000',
    )
  })
})

describe('crypto', () => {
  describe('symmetric', () => {
    describe('generateKey', () => {
      it('should return a base64 string of length 44', () => {
        const key = ErasureHelper.crypto.symmetric.generateKey()
        assert.equal(key.length, 44)
        assert(isBase64(key))
      })
    })
    describe('encryptMessage and decryptMessage', () => {
      it('should encrypt and decrypt a message with one key', () => {
        const key1 = ErasureHelper.crypto.symmetric.generateKey()
        const key2 = ErasureHelper.crypto.symmetric.generateKey()
        const msg = 'this is a message'
        const encryptedMessage = ErasureHelper.crypto.symmetric.encryptMessage(
          key1,
          msg,
        )
        const decryptedMessage = ErasureHelper.crypto.symmetric.decryptMessage(
          key1,
          encryptedMessage,
        )
        assert.equal(decryptedMessage, msg)
        assert.throws(
          () =>
            ErasureHelper.crypto.symmetric.decryptMessage(
              key2,
              encryptedMessage,
            ),
          Error,
          'error thrown',
        )
      })
    })
  })
  describe('asymmetric', () => {
    describe('generateKeyPair', () => {
      it('should generate a public and private key', () => {
        const sig = 'this is a password or web3 signature'
        const salt =
          "this is a salt, which could be generated server side and stored on user table. only authenticated users should be able to GET their own salt from the server and nobody else's."
        const keypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
          sig,
          salt,
        )
        assert(keypair.publicKey instanceof Uint8Array)
        assert.equal(keypair.publicKey.length, 32)
        assert(keypair.secretKey instanceof Uint8Array)
        assert.equal(keypair.secretKey.length, 32)
      })
    })
    describe('generateNonce', () => {
      it('should generate a nonce', () => {
        const nonce = ErasureHelper.crypto.asymmetric.generateNonce()
        assert(nonce instanceof Uint8Array)
        assert.equal(nonce.length, 24)
      })
    })
    describe('encryptMessage and decryptMessage', () => {
      it('should enable bob and alice (not charlie) to share a secret', () => {
        const nonce = ErasureHelper.crypto.asymmetric.generateNonce()

        const bobSig = 'bob signature'
        const bobSalt = 'bob salt'
        const bobKeypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
          bobSig,
          bobSalt,
        )

        const aliceSig = 'alice signature'
        const aliceSalt = 'alice salt'
        const aliceKeypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
          aliceSig,
          aliceSalt,
        )

        const charlieSig = 'charlie signature'
        const charlieSalt = 'charlie salt'
        const charlieKeypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
          charlieSig,
          charlieSalt,
        )

        const msg = 'secret from bob to alice'

        const encryptedMessage = ErasureHelper.crypto.asymmetric.encryptMessage(
          msg,
          nonce,
          aliceKeypair.publicKey,
          bobKeypair.secretKey,
        )

        const decryptedByAlice = ErasureHelper.crypto.asymmetric.decryptMessage(
          encryptedMessage,
          nonce,
          bobKeypair.publicKey,
          aliceKeypair.secretKey,
        )
        assert.equal(decryptedByAlice, msg)

        const decryptedByBob = ErasureHelper.crypto.asymmetric.decryptMessage(
          encryptedMessage,
          nonce,
          aliceKeypair.publicKey,
          bobKeypair.secretKey,
        )
        assert.equal(decryptedByBob, msg)

        assert.throws(() => {
          const decryptedByCharlieAttempt1 = ErasureHelper.crypto.asymmetric.decryptMessage(
            encryptedMessage,
            nonce,
            bobKeypair.publicKey,
            charlieKeypair.secretKey,
          )
        })
        assert.throws(() => {
          const decryptedByCharlieAttempt2 = ErasureHelper.crypto.asymmetric.decryptMessage(
            encryptedMessage,
            nonce,
            aliceKeypair.publicKey,
            charlieKeypair.secretKey,
          )
        })
      })
    })
    describe('secretBox', () => {
      describe('encryptMessage and decryptMessage', () => {
        it('should encrypt and decrypt a message to/from bob and no one else', () => {
          const nonce = ErasureHelper.crypto.asymmetric.generateNonce()

          const bobSig = 'bob signature'
          const bobSalt = 'bob salt'
          const bobKeypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
            bobSig,
            bobSalt,
          )

          const charlieSig = 'charlie signature'
          const charlieSalt = 'charlie salt'
          const charlieKeypair = ErasureHelper.crypto.asymmetric.generateKeyPair(
            charlieSig,
            charlieSalt,
          )

          const msg = 'secret from bob to bob'

          const encryptedMessage = ErasureHelper.crypto.asymmetric.secretBox.encryptMessage(
            msg,
            nonce,
            bobKeypair.secretKey,
          )

          const decryptedByBob = ErasureHelper.crypto.asymmetric.secretBox.decryptMessage(
            encryptedMessage,
            nonce,
            bobKeypair.secretKey,
          )
          assert.equal(decryptedByBob, msg)

          assert.throws(() => {
            const decryptedByCharlieAttempt = ErasureHelper.crypto.asymmetric.secretBox.decryptMessage(
              encryptedMessage,
              nonce,
              charlieKeypair.secretKey,
            )
          })
        })
      })
    })
  })
})
