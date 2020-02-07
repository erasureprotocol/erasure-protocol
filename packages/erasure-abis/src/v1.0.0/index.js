const Contracts = {
    NMR: {
        artifact: require('./abis/MockNMR.json'),
        mainnet: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
        rinkeby: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
    },
    Erasure_Agreements: {
        artifact: require('./abis/Erasure_Agreements.json'),
        mainnet: '0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF',
        rinkeby: '0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC',
    },
    Erasure_Posts: {
        artifact: require('./abis/Erasure_Posts.json'),
        mainnet: '0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29',
        rinkeby: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
    },
    Erasure_Users: {
        artifact: require('./abis/Erasure_Users.json'),
        mainnet: '0x789D0082B20A929D6fB64EB4c10c68e827AAB7aB',
        rinkeby: '0xbF7339e68b81a1261FDF46FDBe916cd88f3609c0',
    },
    PostFactory: {
        artifact: require('./abis/Post_Factory.json'),
        mainnet: '0x480b8d6b5C184C0E34AE66036cC5B4e0390EcA8A',
        rinkeby: '0x375E1f89A995ef4D7A85fE88e3Fa447384E76561',
    },
    Post: {
        artifact: require('./abis/Post.json'),
        mainnet: '0xa6542828b8Ed9Cf0c5772dA569D69574cFe23582',
        rinkeby: '0x8e217bDaB241144F24E2a4E809fcB4BBAA37Fa4a',
    },
    FeedFactory: {
        artifact: require('./abis/Feed_Factory.json'),
        mainnet: '0x1f09dDa453941c2536b9dE8c4382807D1FC603A9',
        rinkeby: '0xDF7bEcEE9C726bb729b8cE47d9CF345c147c035B',
    },
    Feed: {
        artifact: require('./abis/Feed.json'),
        mainnet: '0xd8805190A8ce8416BdE8eEC38A8536b3e1d7a10B',
        rinkeby: '0x5853Dcdc3AB8Ce22e94ca5FdeBa583E8cCec4FA8',
    },
    OneWayGriefingFactory: {
        artifact: require('./abis/OneWayGriefing_Factory.json'),
        mainnet: '0xF06eA7e3D791D88C7F7A88CE1280F36a823A7A62',
        rinkeby: '0x5Ceef2D4dA69dCd077CBf9d1428ad394fd713f04',
    },
    OneWayGriefing: {
        artifact: require('./abis/OneWayGriefing.json'),
        mainnet: '0x67126Dfc428922C87306d5A4dE3dE0BC7bC94847',
        rinkeby: '0x1355eefbD70ea46d61C77F4AF5647FE903bE05A5',
    },
}
module.exports = Contracts
