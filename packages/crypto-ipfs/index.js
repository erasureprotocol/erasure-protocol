const fernet = require('fernet')
const tweetnacl = require('tweetnacl')
const pbkdf2 = require('pbkdf2')
const getRandomValues = require('get-random-values')
const multihash = require('multihashes');
const Hash = require('ipfs-only-hash')

const MAX_UINT32 = Math.pow(2, 32) - 1
const FERNET_SECRET_LENGTH = 32
const NONCE_LENGTH = 24

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const randomNumber = () => getRandomValues(new Uint32Array(1))[0] / MAX_UINT32

const randomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < FERNET_SECRET_LENGTH; i++ ) {
      result += characters.charAt(Math.floor(randomNumber() * charactersLength));
  }
  return result
}

const ErasureHelper = {
  ipfs: {
    hashToHex: (IPFSHash) => "0x" + multihash.toHexString(multihash.fromB58String(IPFSHash)),
    onlyHash: async (data) => {
      let buf = data
      if (!Buffer.isBuffer(data)) {
        buf = Buffer.from(data)
      }
      const hash = await Hash.of(buf)
      return hash
    }
  },
  crypto: {
    symmetric: {
      generateKey: () => btoa(randomString()),
      encryptMessage: (secretKey, msg) => {
        const secret = new fernet.Secret(secretKey)
        const token = new fernet.Token({secret, ttl: 0})
        return token.encode(msg)
      },
      decryptMessage: (secretKey, encryptedMessage) =>  {
        const secret = new fernet.Secret(secretKey)
        const token = new fernet.Token({secret, ttl: 0, token: encryptedMessage})
        return token.decode()
      }
    },
    asymmetric: {
      generateKeyPair: (sig, salt) => tweetnacl.box.keyPair.fromSecretKey(pbkdf2.pbkdf2Sync(sig, salt, 1000, 32)),
      generateNonce: () => tweetnacl.randomBytes(NONCE_LENGTH),
      encryptMessage: (msg, nonce, publicKey, secretKey) => { // publicKey of receiver, secretKey of sender
        const encodedMessage = encoder.encode(msg)
        return tweetnacl.box(encodedMessage, nonce, publicKey, secretKey)
      },
      decryptMessage: (box, nonce, publicKey, secretKey) => { // publicKey of sender and secretKey of receiver, or vice versa (both work)
        const encodedMessage = tweetnacl.box.open(box, nonce, publicKey, secretKey)
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
        }
      }
    }
  }
}

export default ErasureHelper
