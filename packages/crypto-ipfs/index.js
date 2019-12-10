const fernet = require('fernet')
const tweetnacl = require('tweetnacl')
const pbkdf2 = require('pbkdf2')
const getRandomValues = require('get-random-values')
const multihash = require('multihashes')
const sha256_cid = require('ipfs-only-hash')

const MAX_UINT32 = Math.pow(2, 32) - 1
const MAX_UINT8 = Math.pow(2, 8) - 1
const FERNET_SECRET_LENGTH = 32
const NONCE_LENGTH = 24

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const randomNumber = () => {
  if (typeof window === 'undefined') {
    return getRandomValues(new Uint8Array(1))[0] / MAX_UINT8
  }
  return getRandomValues(new Uint32Array(1))[0] / MAX_UINT32
}

const randomString = () => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < FERNET_SECRET_LENGTH; i++) {
    result += characters.charAt(Math.floor(randomNumber() * charactersLength))
  }
  return result
}

/// Convert multihash from input of specified type to multihash buffer object
/// Valid input types:
/// - 'raw': raw data of any form - will caculate chunked ipld content id using sha2-256
/// - 'sha2-256': hex encoded sha2-256 hash - will append multihash prefix
/// - 'hex': hex encoded multihash
/// - 'b58': base58 encoded multihash
async function multihashFrom(input, inputType) {
  const inputTypes = ['raw', 'sha2-256', 'hex', 'b58']
  let contentid
  if (inputType === 'raw') {
    contentid = multihash.fromB58String(await sha256_cid.of(input))
  } else if (inputType === 'sha2-256') {
    input = input.slice(0, 2) === '0x' ? input.slice(2) : input
    contentid = multihash.fromHexString('1220' + input)
  } else if (inputType === 'hex') {
    input = input.slice(0, 2) === '0x' ? input.slice(2) : input
    contentid = multihash.fromHexString(input)
  } else if (inputType === 'b58') {
    contentid = multihash.fromB58String(input)
  } else {
    throw new Error(
      `Invalid inputType: ${inputType} should be one of [${inputTypes}]`,
    )
  }

  multihash.validate(contentid)

  return contentid
}

/// Convert multihash from buffer object to output of specified type
/// Valid output types:
/// - 'prefix': hex encoded multihash prefix
/// - 'digest': hex encoded hash
/// - 'hex': hex encoded multihash
/// - 'b58': base58 encoded multihash
async function multihashTo(contentid, outputType) {
  const outputTypes = ['prefix', 'digest', 'hex', 'b58']
  if (outputType === 'prefix') {
    return '0x' + multihash.prefix(contentid).toString('hex')
  } else if (outputType === 'digest') {
    return '0x' + multihash.toHexString(multihash.decode(contentid).digest)
  } else if (outputType === 'hex') {
    return '0x' + multihash.toHexString(contentid)
  } else if (outputType === 'b58') {
    return multihash.toB58String(contentid)
  } else {
    throw new Error(
      `Invalid outputType: ${outputType} should be one of [${outputTypes}]`,
    )
  }
}

const ErasureHelper = {
  multihash: async ({ input, inputType, outputType }) =>
    multihashTo(await multihashFrom(input, inputType), outputType),
  ipfs: {
    hashToHex: async () => {
      throw new Error(
        `Deprecated ErasureHelper.ipfs.hashToHex : use ErasureHelper.multihash({input:data, inputType:'b58', outputType:'hex'})`,
      )
    },
    onlyHash: async () => {
      throw new Error(
        `Deprecated ErasureHelper.ipfs.hashToHex : use ErasureHelper.multihash({input:data, inputType:'raw', outputType:'b58'})`,
      )
    },
  },
  crypto: {
    symmetric: {
      generateKey: () => {
        let key = Buffer.from(randomString()).toString('base64')
        let secret = fernet.decode64toHex(key)
        while (secret.length !== fernet.hexBits(256)) {
          key = Buffer.from(randomString()).toString('base64')
          secret = fernet.decode64toHex(key)
        }
        return key
      },
      encryptMessage: (secretKey, msg) => {
        const secret = new fernet.Secret(secretKey)
        const token = new fernet.Token({ secret, ttl: 0 })
        return token.encode(msg)
      },
      decryptMessage: (secretKey, encryptedMessage) => {
        const secret = new fernet.Secret(secretKey)
        const token = new fernet.Token({
          secret,
          ttl: 0,
          token: encryptedMessage,
        })
        return token.decode()
      },
    },
    asymmetric: {
      generateKeyPair: (sig, salt) =>
        tweetnacl.box.keyPair.fromSecretKey(
          pbkdf2.pbkdf2Sync(sig, salt, 1000, 32),
        ),
      generateNonce: () => tweetnacl.randomBytes(NONCE_LENGTH),
      encryptMessage: (msg, nonce, publicKey, secretKey) => {
        const encodedMessage = encoder.encode(msg)
        return tweetnacl.box(encodedMessage, nonce, publicKey, secretKey)
      },
      decryptMessage: (box, nonce, publicKey, secretKey) => {
        const encodedMessage = tweetnacl.box.open(
          box,
          nonce,
          publicKey,
          secretKey,
        )
        return decoder.decode(encodedMessage)
      },
      secretBox: {
        encryptMessage: (msg, nonce, secretKey) => {
          const encodedMessage = encoder.encode(msg)
          return tweetnacl.secretbox(encodedMessage, nonce, secretKey)
        },
        decryptMessage: (box, nonce, secretKey) => {
          const encodedMessage = tweetnacl.secretbox.open(box, nonce, secretKey)
          return decoder.decode(encodedMessage)
        },
      },
    },
  },
}

module.exports = ErasureHelper
