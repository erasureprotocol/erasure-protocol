const { ApolloClient } = require("apollo-client")
const fetch = require("node-fetch")
const { InMemoryCache } = require('apollo-cache-inmemory');
const { createHttpLink } = require('apollo-link-http');
const {NETWORKS,GRAPH_URLS} = require("./utils")
const Queries = require("./QL_V3/Schema")
const gql = require("graphql-tag")
const IPFS = require("ipfs-mini")


/**
 * Client to query Erasure data from explorer
 */
class ErasureGraph {
    constructor({ network=NETWORKS.rinkeby,ipfsOpts=null}={}) {
        const ipfs_opts = ipfsOpts || { host: "ipfs.infura.io", port: "5001", protocol: "https" }
        this.ipfs = new IPFS(ipfs_opts)
        const cache = new InMemoryCache();
        const uri = GRAPH_URLS.V3[network]
        const link = createHttpLink({ uri, fetch })
        this.client = new ApolloClient({ cache, link })
        this.NETWORKS=NETWORKS
        for (let event in Queries) {
            const query = Queries[event]
            this[event] = async ({count=null,id=null,opts = {}}={}) => {
                return await this.query({ opts,count,id, eventName: event, returnData: query.returnData })
            }
        }
    }

    /**
     * Query any event name
     * @param {} queryName (optional)
     * @param {*} eventName
     * @param {*} opts
     * @param {*} returnData
     */
    async query({eventName, count=null,id=null,opts={}}={}) {
        try {
            const  queryName = "Erasure"
            const returnData =Queries[eventName].returnData
            if(id){
                opts.id=id
            }
            else if(count){
                opts =`(first:${count})`    
            }
            const query = `query ${queryName}{${eventName}(where:${JSON.stringify(opts)}) {
            ${returnData}
          } }`
            const res = await this.client.query({ query: gql`${query}` })
            return res.data[eventName]
        } catch (e) {
            return e.message
        }

    }


    //==== FEED ===//
    /**
     * Check Ipfs to see if the hash is there
     * @param {} hash 
     * @return {Boolean} revealed
    */
   async isRevealed(hash){
    const data = await this.ipfs.catJSON(hash)
    return Boolean(data)
   }
   /**
    * get hash from ipfs and return json data of that hash from ipfs
    * @param {*} hash
    * @return {JSON} json data  
    */
   async parseProofHash(hash){
    const data = await this.ipfs.catJSON(hash)
    return data
   }

    /**
     * subscribe to events
     * If no evenName specified, will listen to all events
     * TODO
     * */
    async subscribeToEvent(eventName = null) {
    }

}
module.exports = ErasureGraph