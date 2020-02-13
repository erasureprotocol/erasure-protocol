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
        artifact: require('./abis/iUniswapFactory.json'),
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
        mainnet: '',
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
        mainnet: '',
        rinkeby: '0x4b81D52e3c196B1D6D445bd99d356A86Eb98e86E',
        kovan: '0x3A1a3EfeDf5C3932Bac1b637EA8Ac2D904C58480',
    },
    Feed: {
        artifact: require('./abis/Feed.json'),
        mainnet: '',
        rinkeby: '0x53EcA61358Bb949F1A70E92142eb1974Fb3cB298',
        kovan: '0x276e1fdB65951B8c1d1c16C5B69a72bE3060E7AA',
    },
    SimpleGriefing_Factory: {
        artifact: require('./abis/SimpleGriefing_Factory.json'),
        mainnet: '',
        rinkeby: '0xD4817F7Ba9A518bB2abA008f0754f440529E6219',
        kovan: '0xe1fE447275B02Cec4c36654E33D245Eb4a95fBE3',
    },
    SimpleGriefing: {
        artifact: require('./abis/SimpleGriefing.json'),
        mainnet: '',
        rinkeby: '0xA262EDBb8E74025BAD1D80ACF603D688d14e98b8',
        kovan: '0x783E162F8597a0bdBC88af97Da14a4957Cc3a616',
    },
    CountdownGriefing_Factory: {
        artifact: require('./abis/CountdownGriefing_Factory.json'),
        mainnet: '',
        rinkeby: '0xe7862De73fF5678251a6183e757AAbbe4F5AfA2C',
        kovan: '0x10034DcE3D78168dc76c905EB3B3481E823DA48a',
    },
    CountdownGriefing: {
        artifact: require('./abis/CountdownGriefing.json'),
        mainnet: '',
        rinkeby: '0xafD67e6B6e29db30D59BE1dC31aa42cF531aC29F',
        kovan: '0xc110156B813a122F5F4766937d8D54035A04fEB5',
    },
    CountdownGriefingEscrow_Factory: {
        artifact: require('./abis/CountdownGriefingEscrow_Factory.json'),
        mainnet: '',
        rinkeby: '0x912FF45B8B3dad13E2E2EFD1414bFF811a87b548',
        kovan: '0x2D1a2e0bB4a770d2257D02eCd60D730268F3dad6',
    },
    CountdownGriefingEscrow: {
        artifact: require('./abis/CountdownGriefingEscrow.json'),
        mainnet: '',
        rinkeby: '0xCc10AEB2a364f9873Ecb83Ed6DB7f6D7284d1446',
        kovan: '0xc586D68F661C59320da5014A12Fde888b7696883',
    },
}
module.exports = Contracts
