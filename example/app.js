//@ts-nocheck

const Table = require('cli-table')
const bs58 = require('bs58')
const multihash = require('multihashes')
const ethers = require('ethers')
const provider = new ethers.providers.JsonRpcProvider()

const feedABI = require('../packages/testenv/build/Feed.json')
const feedFactoryABI = require('../packages/testenv/build/Feed_Factory.json')
const erasureUsersABI = require('../packages/testenv/build/Erasure_Users.json')
const erasureUsersAddress = '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab'
const Erasure_EscrowsABI = require('../packages/testenv/build/CountdownGriefingEscrow.json')
const AgreementFactory_Artifact = require('../packages/testenv/build/CountdownGriefing.json')
const CountdownGriefingEscrowABI = require('../packages/testenv/build/CountdownGriefingEscrow.json')
const mockNMRABI = require('../packages/testenv/build/MockNMR.json')
const CountdownGriefingEscrow_FactoryABI = require('../packages/testenv/build/CountdownGriefingEscrow_Factory.json')

const Ipfs = require('ipfs-http-client')
const ipfsConfig = require('./IPFSconfig.json')
const Hash = require('ipfs-only-hash')

const crypto = require('crypto')
const cryptoIpfs = require('@erasure/crypto-ipfs')
const util = require('util')
const textEncoder = new util.TextEncoder()
const textDecoder = new util.TextDecoder()

const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
const operator = new ethers.Wallet(privateKey, provider)


const seller = {
    privateKey: "0x09e7f380dc94703dd28abfcb175123e90b1f64192f5ec54935a9f51c2f4cc88c",
    address: "0x7B6a7E09E942FFbd7C4D8556d540097A32386247",
    wallet: '',
    keyPair: ''
}
const buyer = {
    privateKey: "0xc1d9fa20df2c02664a1cb6df9407650526c72f55b940aef24204e3c0c374f151",
    address: "0xe0846649527818EE892Af5073170e5A51E452e8e",
    wallet: '',
    keyPair: ''
}

const db = {}
const originalPredictionData = 'My worthy prediction is secret!'

main()

async function main() {
    const {
        walletSeller,
        walletBuyer
    } = await fundWallets() // We should have wallets with ETH for the seller and the buyer

    seller.wallet = walletSeller
    seller.keyPair = await generateKeypair(seller.wallet) // Generate asymmetric key pair used for encryption / decryption

    buyer.wallet = walletBuyer
    buyer.keyPair = await generateKeypair(buyer.wallet) // Generate asymmetric key pair used for encryption / decryption

    if (!await isUserRegistered(seller.wallet)) await registerUser(seller.wallet, seller.keyPair.publicKey) // Add seller asymmetric PubKey generated above to the User Registry Smart Contract for future encryption work
    if (!await isUserRegistered(buyer.wallet)) await registerUser(buyer.wallet, buyer.keyPair.publicKey) // Add buyer asymmetric PubKey generated above to the User Registry Smart Contract for future encryption work

    let {
        proofhash,
        encryptedSymKeyInfo
    } = await generateProofHash(originalPredictionData, seller.address, seller.keyPair) // Generate proofhash && metadata

    await createAndSubmitPost(seller.wallet, proofhash, db.metadata) // Submit proofhash and metadata to Feed Contract upoin initialization

    let escrowContract = await createEscrowFromFactory(operator, seller.wallet, buyer.wallet) // Generate escrow between seller and buyer with predefined initialization params
    db.escrowContractAddress = escrowContract.address

    await mintAndApproveTokens('1', walletSeller, db.escrowContractAddress) // Mint NMR tokens to the seller in order to be able to interact within the Erasure ecosystem. Approve Escrow Contract to use them on behalf of the seller in all circumstances
    await mintAndApproveTokens('2', walletBuyer, db.escrowContractAddress) // Mint NMR tokens to the buyer in order to be able to interact within the Erasure ecosystem. Approve Escrow Contract to use them on behalf of the buyer in all circumstances
    await depositStake(db.escrowContractAddress, walletSeller) // Seller must deposit stake in order to continue further
    await depositPayment(db.escrowContractAddress, walletBuyer) // Buyer must deposit a payment as well

    let escrowSeller = getEscrowContract(seller.wallet) // Act as the seller within the escrow contract
    let tx = await escrowSeller.finalize() // finalize contract while agreement has been reached
    db.agreementAddress = (await findEventByName(db.escrowContractAddress, Erasure_EscrowsABI.compilerOutput.abi, tx.hash, 'Finalized')).values.agreement //on finalization of the escrow, an agreement contract is created. Agreement will end up in 60 days after initialization
    let agreementContract = new ethers.Contract(db.agreementAddress, AgreementFactory_Artifact.compilerOutput.abi, operator)

    let decryptedSymKey = await decryptSymKey(seller.keyPair.publicKey, seller.keyPair.secretKey, encryptedSymKeyInfo) // Seller decrypts the symmetric key used for encryption of the valuable data he possess
    let sellData = await generateSellData(decryptedSymKey, buyer.keyPair.publicKey, seller.keyPair.secretKey) // generate Sell Data from Seller. Buyer PubKey might be fetched from the user registry contract

    let submitSaleDataTx = await escrowSeller.submitData(sellData) // Seller submits the data for the buyer to download and validate

    db.escrowSubmitTx = submitSaleDataTx.hash
    db.validationSuccess = false

    await validateData(sellData, buyer.keyPair.secretKey, seller.keyPair.publicKey) // Buyer decrypts the data and validates if the data sold, correspond to the one claimed by the seller.
    printToConsole()
}

function printToConsole() {
    var table = new Table({
        head: ['Key', 'Value']
    })

    for (prop in db) {
        table.push([
            prop, db[prop]
        ])
    }
    console.log(table.toString())
}

async function isUserRegistered(_wallet = operator) {
    let users_contract = new ethers.Contract(erasureUsersAddress, erasureUsersABI.compilerOutput.abi, _wallet)
    let userData = await users_contract.getUserData(_wallet.address)

    if (userData != '0x') {
        console.log(`User PubAsymKey: ${userData}`)
        return true
    }

    return false
}

async function registerUser(_wallet = operator, asymPubKey) {
    let users_contract = new ethers.Contract(erasureUsersAddress, erasureUsersABI.compilerOutput.abi, _wallet)
    const publicKeyHex = Buffer.from(asymPubKey).toString("hex")

    await users_contract.registerUser(`0x${publicKeyHex}`)

    console.log(`User PubAsymKey: 0x${publicKeyHex}`)
}

async function fundWallets() {
    const fundAmount = ethers.utils.parseEther('5')

    let walletSeller = new ethers.Wallet(seller.privateKey, provider)
    let walletBuyer = new ethers.Wallet(buyer.privateKey, provider)

    let transactionSeller = {
        to: walletSeller.address,
        value: fundAmount,
    }

    let transactionBuyer = {
        to: walletBuyer.address,
        value: fundAmount,
    }

    let balance = parseInt(await provider.getBalance(seller.address))

    if (balance == 0) {
        await operator.sendTransaction(transactionSeller)
        await operator.sendTransaction(transactionBuyer)
    }

    return {
        walletSeller,
        walletBuyer
    }
}

async function decryptSymKey(pubKey, secretKey, encryptedSymKeyInfo) {
    return await decrypt(encryptedSymKeyInfo.encryptedSymKey, pubKey, encryptedSymKeyInfo.randomNonce, secretKey)
}

async function generateSellData(decryptedSymKey, pubKeyBuyer, secretKeySeller) {
    let proofhash = (await findEventByName(db.feedContractAddress, feedABI.compilerOutput.abi, db.feedTxHash, 'Initialized')).values.proofHash
    let encryptedInfo = await encrypt(pubKeyBuyer, decryptedSymKey, secretKeySeller)

    let json_sellData_120 = JSON.stringify({
        encryptedInfo,
        proofhash
    })

    const sellDataToIPFS = await IPFS.add(
        json_sellData_120
    )

    db.sellDataToIPFS = sellDataToIPFS

    return hashToSha256(sellDataToIPFS)
}

async function createAndSubmitPost(_wallet, proofhash, metadata) {
    let feedFactory = new ethers.Contract('0x67B5656d60a809915323Bf2C40A8bEF15A152e3e', feedFactoryABI.compilerOutput.abi, _wallet)
    let operator = _wallet.address

    let args = [operator, proofhash, metadata]
    let callData = abiEncodeWithSelector(
        'initialize',
        ['address', 'bytes32', 'bytes'],
        args,
    )

    let tx = await feedFactory.create(callData)
    let txRcpt = await tx.wait()

    const expectedEvent = 'InstanceCreated'
    const createFeedEvent = txRcpt.events.find(
        emittedEvent => emittedEvent.event === expectedEvent,
        'There is no such event',
    )
    const feedAddress = createFeedEvent.args.instance
    db.feedTxHash = txRcpt.transactionHash
    db.feedContractAddress = feedAddress
}

//ESCROW FUNCTIONS
async function createEscrowFromFactory(operator, seller, buyer) {
    const AbiCoder = new ethers.utils.AbiCoder()

    const escrowCountdown = 2 * 24 * 60 * 60 // 2 days
    const agreementCountdown = 30 * 24 * 60 * 60 // 30 days
    const paymentAmount = ethers.utils.parseEther('2')
    const stakeAmount = ethers.utils.parseEther('1')
    const griefRatio = ethers.utils.parseEther('3')
    const ratioType = 2

    let factory = new ethers.Contract('0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec', CountdownGriefingEscrow_FactoryABI.compilerOutput.abi, operator)
    const agreementTypes = ['uint120', 'uint8', 'uint128']
    const agreementParams = [griefRatio, ratioType, agreementCountdown]
    const encodedParams = AbiCoder.encode(agreementTypes, agreementParams)

    let initTypes = [
        'address',
        'address',
        'address',
        'uint256',
        'uint256',
        'uint256',
        'bytes',
        'bytes',
    ]

    let initParams = [
        operator.address, //operator
        buyer.address,
        seller.address,
        paymentAmount,
        stakeAmount,
        escrowCountdown,
        '0x',
        encodedParams,
    ]
    const calldata = abiEncodeWithSelector('initialize', initTypes, initParams)

    // deploy escrow contract
    const tx = await factory.create(calldata)
    const receipt = await tx.wait(tx)

    const expectedEvent = 'InstanceCreated'
    const createFeedEvent = receipt.events.find(emittedEvent => emittedEvent.event === expectedEvent)

    return new ethers.Contract(createFeedEvent.args.instance, CountdownGriefingEscrowABI.compilerOutput.abi, operator)
}

function getEscrowContract(wallet) {
    return new ethers.Contract(db.escrowContractAddress, Erasure_EscrowsABI.compilerOutput.abi, wallet)
}

async function mintAndApproveTokens(_amount, from, to) {
    const stakeAmount = ethers.utils.parseEther(_amount)
    let mockNMRFrom = new ethers.Contract('0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671', mockNMRABI.compilerOutput.abi, from)

    // Mint Tokens to 
    await mockNMRFrom.mintMockTokens(from.address, stakeAmount)
    await mockNMRFrom.approve(to, stakeAmount)
}

// not finished
async function depositStake(escrowContractAddres, seller) {
    let escrowSeller = new ethers.Contract(escrowContractAddres, Erasure_EscrowsABI.compilerOutput.abi, seller)

    let txDeposit = await escrowSeller.depositStake()
    let txReceipt = await txDeposit.wait()
    let expectedEvent = 'StakeDeposited'
}

async function depositPayment(escrowContractAddres, buyer) {
    let escrowBuyer = new ethers.Contract(escrowContractAddres, Erasure_EscrowsABI.compilerOutput.abi, buyer)
    let tx = await escrowBuyer.depositPayment()
}

function abiEncodeWithSelector(functionName, abiTypes, abiValues) {
    const abiEncoder = new ethers.utils.AbiCoder()
    const initData = abiEncoder.encode(abiTypes, abiValues)
    const selector = createSelector(functionName, abiTypes)
    const encoded = selector + initData.slice(2)
    return encoded
}

function createSelector(functionName, abiTypes) {
    const joinedTypes = abiTypes.join(',')
    const functionSignature = `${functionName}(${joinedTypes})`

    const selector = ethers.utils.hexDataSlice(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)),
        0,
        4,
    )
    return selector
}

function hashToSha256(hash) {
    return bs58
        .decode(hash)
        .toString("hex")
        .replace("1220", "0x")
}

function sha256ToHash(hex) {
    return hexToHash(`0x1220${hex.substr(2)}`)
}

function hexToHash(hex) {
    return bs58.encode(Buffer.from(hex.substr(2), "hex"))
}

function hashToHex(IPFSHash) {
    return "0x" + multihash.toHexString(multihash.fromB58String(IPFSHash))
}

async function findEventByName(contractAdress, abi, receipt, name) {
    let feedContract = new ethers.Contract(contractAdress, abi, operator)
    let txRcpt = await operator.provider.getTransactionReceipt(receipt)

    for (const key in txRcpt.logs) {
        let event = (txRcpt.logs[key])

        if (feedContract.interface.parseLog(event) && feedContract.interface.parseLog(event).name == name) {
            let data = feedContract.interface.parseLog(event)
            return {
                name: data.name,
                values: data.values
            }
        }
    }
}

const IPFS = {
    ipfs: null,
    keystore: {},
    getClient: () => {
        if (IPFS.ipfs === null) {
            IPFS.ipfs = new Ipfs(ipfsConfig.ipfs.host, ipfsConfig.ipfs.port, {
                protocol: ipfsConfig.ipfs.protocol
            })
        }

        return IPFS.ipfs
    },
    add: async (data, retry = true) => {
        try {
            let client = await IPFS.getClient()
            let result = await client.add(data)

            return result[0].path

        } catch (err) {
            if (retry) {
                return await IPFS.add(data, false)
            } else {
                throw err
            }
        }
    },
    get: async (hash, retry = true) => {
        try {
            let client = await IPFS.getClient()
            let result = await client.get(hash)

            return Buffer.from(result[0].content).toString()
        } catch (err) {
            if (retry) {
                return await IPFS.get(hash, false)
            } else {
                throw err
            }
        }
    },
    onlyHash: async data => {
        let buf = data

        if (!Buffer.isBuffer(data)) {
            buf = Buffer.from(data)
        }
        const hash = await Hash.of(buf)
        return hash
    }

}

//CRYPTO
async function generateKeypair(wallet) {
    try {
        const address = wallet.address
        const msg = `I am signing this message to generate my ErasureClient keypair as ${address}`
        const signature = await wallet.signMessage(msg)
        const salt = crypto.createHash('sha256').update(address).digest('base64')
        const key = cryptoIpfs.crypto.asymmetric.generateKeyPair(
            signature,
            salt
        )

        return key
    } catch (error) {
        throw error
    }
}

async function generateProofHash(rawData, sellerAddress, keyPair) {
    let symKey = cryptoIpfs.crypto.symmetric.generateKey()
    console.log(`Using SymKey: ${symKey}`)

    const encryptedData = await cryptoIpfs.crypto.symmetric.encryptMessage(symKey, rawData)
    const keyhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(symKey))
    const datahash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(rawData))
    const encryptedDatahash = await IPFS.add(Buffer.from(encryptedData, "utf-8"))

    const staticMetadataB58 = await IPFS.add(
        Buffer.from(JSON.stringify({
            creator: sellerAddress,
            datahash,
            keyhash,
            encryptedDatahash
        }), "utf-8")
    )

    const encryptedSymKeyInfo = await encrypt(keyPair.publicKey, symKey, keyPair.secretKey)

    const proofhash = hashToSha256(staticMetadataB58)
    db.metadata = hashToHex(staticMetadataB58)

    return {
        proofhash,
        encryptedSymKeyInfo
    }

}

async function encrypt(pubKey, symkey, secretKey) {
    let msg = textEncoder.encode(symkey)

    let randomNonce = cryptoIpfs.crypto.asymmetric.generateNonce()
    let encryptedSymKey = cryptoIpfs.crypto.asymmetric.encryptMessage(msg, randomNonce, pubKey, secretKey)

    return {
        encryptedSymKey,
        randomNonce
    }
}

async function decrypt(encryptedKey, lockedPubKey, randomNonce, asymSecretKey) {
    let decryptedKey = await cryptoIpfs.crypto.asymmetric.decryptMessage(encryptedKey, randomNonce, lockedPubKey, asymSecretKey)

    let stringToArray = decryptedKey.split(',').map(Number)
    let uintArr = new Uint8Array(stringToArray)
    decryptedKey = textDecoder.decode(uintArr)

    return decryptedKey
}

async function validateData(soldDataB58, buyerAsymSecretKey, sellerPubKey) { //db.metadata
    // Decrypt Sold Data
    const staticMetadataB58Sold = sha256ToHash(soldDataB58)
    const IpfsData = JSON.parse(await IPFS.get(staticMetadataB58Sold))

    const encryptedSymKey_Buyer = new Uint8Array(Object.values(IpfsData.encryptedInfo.encryptedSymKey))
    const randomNonce = new Uint8Array(Object.values(IpfsData.encryptedInfo.randomNonce))
    const proofIpfsPath = sha256ToHash(IpfsData.proofhash)

    db.decryptedSymKey = await decrypt(encryptedSymKey_Buyer, sellerPubKey, randomNonce, buyerAsymSecretKey)
    const proofData = JSON.parse(await IPFS.get(proofIpfsPath))

    //Decrypt original Data
    const encryptedDataIpfsPath = await IPFS.get(proofData.encryptedDatahash)
    db.revealedRawData = cryptoIpfs.crypto.symmetric.decryptMessage(db.decryptedSymKey, encryptedDataIpfsPath)

    const validDataHash = proofData.datahash == ethers.utils.keccak256(ethers.utils.toUtf8Bytes(db.revealedRawData))
    const validRawData = proofData.keyhash == ethers.utils.keccak256(ethers.utils.toUtf8Bytes(db.decryptedSymKey))

    db.revealedDataHash = proofData.datahash
    db.revealedKeyHash = proofData.keyhash
    db.validationSuccess = validDataHash && validRawData
    console.log('Is data valid:', db.validationSuccess)
}