const ErasureGraph = require("../index")
const assert = require("assert")
const {NETWORKS} = require("../utils")
const IPFS = require("ipfs-mini")

describe("Erasure graph test",function(){
    let client
    describe("Reading feeds from the graphs", function(){
        const ipfsOpts = { host: "ipfs.infura.io", port: "5001", protocol: "https" }
        const ipfs = new IPFS(ipfsOpts)
        before(async ()=>{
            client = new ErasureGraph({network:NETWORKS.rinkeby})
        })
        it("Should get all feeds", async()=>{
            const feeds = await client.feeds()
            console.log("feeds",feeds)
            assert(feeds,"no feeds found")
        })
        it("should add data to upfs and see if we can get it back as revealed and parse",async()=>{
            const data = {
                address:"address",
                rawDataHashL:"rawDataHash",
                keyHash:"keyHash",
                encryptedDataHash:"encryptedDataHash"
            }
            const hash = await ipfs.addJSON(data)
            console.log("ipfs hash",hash)
            const isRevealed = await client.isRevealed(hash)
            console.log("isRevealed", isRevealed)
            assert(isRevealed,"should be revealed")
            const ipfsData = await client.parseProofHash(hash)
            console.log("ipfs data", ipfsData, typeof(ipfsData))
            assert.deepEqual(ipfsData,data)
        })
    })
})