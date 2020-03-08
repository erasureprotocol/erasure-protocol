const Contracts = {
    iNMR: {
        artifact: require('./abis/iNMR.json'),
    },
    iERC20: {
        artifact: require('./abis/iERC20.json'),
    },
    iUniswapFactory: {
        artifact: require('./abis/iUniswapFactory.json'),
    },
    iUniswapExchange: {
        artifact: require('./abis/iUniswapExchange.json'),
    },
    iAuthereumAccount: {
        artifact: require('./abis/iAuthereumAccount.json'),
    },
    iRegistry: {
        artifact: require('./abis/iRegistry.json'),
    },
    iFactory: {
        artifact: require('./abis/iFactory.json'),
    },
    NMR: {
        artifact: require('./abis/MockNMR.json'),
        mainnet_nonce: 1,
        mainnet_deployer: '0x9608010323ed882a38ede9211d7691102b4f0ba0',
        mainnet: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
        rinkeby: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
        kovan: '0xe9E2dF04e6d699986A5E0f131Eb37aAAd4BA2bdC',
    },
    NMR_Uniswap: {
        artifact: require('./abis/MockUniswapExchange.json'),
        mainnet_nonce: 41,
        mainnet_deployer: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
        mainnet: '0x2Bf5A5bA29E60682fC56B2Fcf9cE07Bef4F6196f',
        rinkeby: '0xd6Bb4d352C56Fdd6D2817732821aFDF94204cDF6',
        kovan: '0xbFAAdabFab5e3Ff17f06dc15b128bfCc9fCCA7Ee',
    },
    DAI: {
        artifact: require('./abis/MockERC20.json'),
        mainnet_nonce: 1,
        mainnet_deployer: '0xb5b06a16621616875A6C2637948bF98eA57c58fa',
        mainnet: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        rinkeby: '0x2448eE2641d78CC42D7AD76498917359D961A783',
        kovan: '0x7d669A64deb8a4A51eEa755bb0E19FD39CE25Ae9',
    },
    DAI_Uniswap: {
        artifact: require('./abis/MockUniswapExchange.json'),
        mainnet_nonce: 1225,
        mainnet_deployer: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
        mainnet: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667',
        rinkeby: '0x77dB9C915809e7BE439D2AB21032B1b8B58F6891',
        kovan: '0xC9883D347C200d9CBA014389220C4df45648F03a',
    },
    UniswapFactory: {
        artifact: require('./abis/MockUniswapFactory.json'),
        mainnet: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
        rinkeby: '0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36',
        kovan: '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30',
    },
    RegistryManager: {
        artifact: require('./abis/RegistryManager.json'),
        mainnet: '0x58414777A792CD8E5A3D9f2fA576B16c38378234',
        rinkeby: '0x92D89D5909fCf50d46c30EaD7fF0B5707F59Fe9c',
        kovan: '0x4Fe2e04498ad1c8c0F386073C3324e75b830af97',
    },
    Erasure_Posts: {
        artifact: require('./abis/Erasure_Posts.json'),
        mainnet: '0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29',
        rinkeby: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
        kovan: '0xB88336e7D856b55eCB1e7561d90e025386E8b3e3',
    },
    Erasure_Agreements: {
        artifact: require('./abis/Erasure_Agreements.json'),
        mainnet: '0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF',
        rinkeby: '0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC',
        kovan: '0x09f83e08CC9F41CE8bd901a214F36B2ba958D7eD',
    },
    Erasure_Escrows: {
        artifact: require('./abis/Erasure_Escrows.json'),
        mainnet: '0x409EA12E73a10EF166bc063f94Aa9bc952835E93',
        rinkeby: '0xFD6a8b50B7D97133B03f48a08E9BEF5f664e092c',
        kovan: '0x0a726cD79a6E6c0eBeCeEAC8938C5922dc5dDd2B',
    },
    Erasure_Users: {
        artifact: require('./abis/Erasure_Users.json'),
        mainnet: '0x789D0082B20A929D6fB64EB4c10c68e827AAB7aB',
        rinkeby: '0xbF7339e68b81a1261FDF46FDBe916cd88f3609c0',
        kovan: '0xf63ca73e164884793165EE908f216500e49Ad080',
    },
    Feed_Factory: {
        artifact: require('./abis/Feed_Factory.json'),
        mainnet: '0x91b052E4800DB77d4d0BFE9fe2bE48352695F282',
        rinkeby: '0xA7B0777Fa862557e969ED47E1c8EEB27275b6743',
        kovan: '0xb7E3a68f2Aa5Ba26A6f06bb85b5E29Fea64f02f1',
    },
    Feed: {
        artifact: require('./abis/Feed.json'),
        mainnet: '0xabFe46E50D7A72e17688b44ce4f8B95545020560',
        rinkeby: '0x561505d0A0c9d4607B63D8f85EbEB6Ec88574ab4',
        kovan: '0x03BfdDB0716b0e5Aa21CB867D4c0167C1430cb4F',
    },
    SimpleGriefing_Factory: {
        artifact: require('./abis/SimpleGriefing_Factory.json'),
        mainnet: '0x2279B24B7b7B66221807CF82a526D64Df4Dfc373',
        rinkeby: '0x19028442CCf93e3d53A2C8329aBda8b29b3c1E69',
        kovan: '0x1D0363AFDBB86694555eBef591b665520b2671aa',
    },
    SimpleGriefing: {
        artifact: require('./abis/SimpleGriefing.json'),
        mainnet: '0xd99139e8A6C5e65fdE4DE2Ce527AE56e8fC5EAE1',
        rinkeby: '0xA8344120BB14448495898cdA1Ef21Fc5ca9f06e0',
        kovan: '0x1917E56a6BfB671b4Ef3B8e482249A4D98bF310b',
    },
    CountdownGriefing_Factory: {
        artifact: require('./abis/CountdownGriefing_Factory.json'),
        mainnet: '0xaeaf48234262Ffb6Eed3f37f87e84fBf612Dc5b8',
        rinkeby: '0x0992667832B282141bF13F2683418a170ee65fB2',
        kovan: '0xffc062e58CB967d2ca33F9d714257f9f003A3b6d',
    },
    CountdownGriefing: {
        artifact: require('./abis/CountdownGriefing.json'),
        mainnet: '0x8839C6242112D2a8d7EFF5E457A83bF88cC13705',
        rinkeby: '0xf42703686238a361055876B2687d015ad41540A2',
        kovan: '0x51FA999b00aCA5005AE4599b71ef05e32E9A2D00',
    },
    CountdownGriefingEscrow_Factory: {
        artifact: require('./abis/CountdownGriefingEscrow_Factory.json'),
        mainnet: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
        rinkeby: '0x4D73D74cFD63DCFf2cB09b4F17121e5356bcCAbE',
        kovan: '0x8CC69208a62d0b840d0DDA8De72e1cE033802ecA',
    },
    CountdownGriefingEscrow: {
        artifact: require('./abis/CountdownGriefingEscrow.json'),
        mainnet: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
        rinkeby: '0x1AbbD73Ae3099f6c718426E1EFed51b319Acf4f8',
        kovan: '0xc861a9DEF2D636185cfc2570eb8f8ef37C6Ec02e',
    },
}
module.exports = Contracts
