const VERSIONS = {
    V1: "V1",
    V2: "V2",
    V3: "V3"
};
const NETWORKS = {
    mainnet: "mainnet",
    rinkeby: "rinkeby",
    kovan: "kovan",
    ganache: "ganache",
    ropsten:"ropsten"
};

const GRAPH_URLS = {
    V1: {
        rinkeby: "",
        mainnet: ""
    },
    V2: {
        rinkeby: "https://api.thegraph.com/subgraph/name/erasureprotocol/rinkeby-v120",
        mainnet: "https://api.thegraph.com/subgraph/name/erasureprotocol/v120"
    },
    V3: {
        rinkeby: "https://api.thegraph.com/subgraphs/name/erasureprotocol/rinkeby-v130",
        mainnet: ""
    }
};

module.exports={
    GRAPH_URLS,
    NETWORKS,
    VERSIONS
}