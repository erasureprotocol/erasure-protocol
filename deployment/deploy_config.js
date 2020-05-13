const contracts = {
  NMR: {
    token: {
      artifact: require('../build/MockNMR.json'),
      mainnet: {
        address: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
        deployer: '0x9608010323ed882a38ede9211d7691102b4f0ba0',
        nonce: 1,
      },
      rinkeby: {
        address: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
      },
      kovan: {
        address: '0xe9E2dF04e6d699986A5E0f131Eb37aAAd4BA2bdC',
      },
    },
    uniswap: {
      artifact: require('../build/MockUniswapExchange.json'),
      mainnet: {
        address: '0x2Bf5A5bA29E60682fC56B2Fcf9cE07Bef4F6196f',
        deployer: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
        nonce: 41,
      },
      rinkeby: {
        address: '0xd6Bb4d352C56Fdd6D2817732821aFDF94204cDF6',
      },
      kovan: {
        address: '0xbFAAdabFab5e3Ff17f06dc15b128bfCc9fCCA7Ee',
      },
    },
  },
  DAI: {
    token: {
      artifact: require('../build/MockERC20.json'),
      mainnet: {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        deployer: '0xb5b06a16621616875A6C2637948bF98eA57c58fa',
        nonce: 1,
      },
      rinkeby: {
        address: '0x2448eE2641d78CC42D7AD76498917359D961A783',
      },
      kovan: {
        address: '0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
      },
    },
    uniswap: {
      artifact: require('../build/MockUniswapExchange.json'),
      mainnet: {
        address: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667',
        deployer: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
        nonce: 1225,
      },
      rinkeby: {
        address: '0x77dB9C915809e7BE439D2AB21032B1b8B58F6891',
      },
      kovan: {
        address: '0x47D4Af3BBaEC0dE4dba5F44ae8Ed2761977D32d6',
      },
    },
  },
  UniswapFactory: {
    artifact: require('../build/MockUniswapFactory.json'),
  },
  RegistryManager: {
    artifact: require('../build/RegistryManager.json'),
    mainnet: {
      address: '',
    },
    rinkeby: {
      address: '0x92D89D5909fCf50d46c30EaD7fF0B5707F59Fe9c',
    },
    kovan: {
      address: '0x4Fe2e04498ad1c8c0F386073C3324e75b830af97',
    },
  },
  Erasure_Users: {
    artifact: require('../build/Erasure_Users.json'),
    mainnet: {
      address: '0x789D0082B20A929D6fB64EB4c10c68e827AAB7aB',
    },
    rinkeby: {
      address: '0xbF7339e68b81a1261FDF46FDBe916cd88f3609c0',
    },
    kovan: {
      address: '0xf63ca73e164884793165EE908f216500e49Ad080',
    },
  },
  Erasure_Posts: {
    artifact: require('../build/Erasure_Posts.json'),
    mainnet: {
      address: '0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29',
    },
    rinkeby: {
      address: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
    },
    kovan: {
      address: '0xB88336e7D856b55eCB1e7561d90e025386E8b3e3',
    },
  },
  Erasure_Agreements: {
    artifact: require('../build/Erasure_Agreements.json'),
    mainnet: {
      address: '0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF',
    },
    rinkeby: {
      address: '0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC',
    },
    kovan: {
      address: '0x09f83e08CC9F41CE8bd901a214F36B2ba958D7eD',
    },
  },
  Erasure_Escrows: {
    artifact: require('../build/Erasure_Escrows.json'),
    mainnet: {
      address: '0x409EA12E73a10EF166bc063f94Aa9bc952835E93',
    },
    rinkeby: {
      address: '0xFD6a8b50B7D97133B03f48a08E9BEF5f664e092c',
    },
    kovan: {
      address: '0x0a726cD79a6E6c0eBeCeEAC8938C5922dc5dDd2B',
    },
  },
  Feed: {
    factory: {
      artifact: require('../build/ErasureFactory.json'),
      mainnet: {
        address: '0xEF078E8330f99186079BE1d2ee6b4a5d6f23E8F1',
      },
      rinkeby: {
        address: '0x4b81D52e3c196B1D6D445bd99d356A86Eb98e86E',
      },
      kovan: {
        address: '0x3A1a3EfeDf5C3932Bac1b637EA8Ac2D904C58480',
      },
    },
    template: {
      artifact: require('../build/Feed.json'),
      mainnet: {
        address: '0xea14477b327B9E4be4cdfBcE2df04C09F7D2a196',
      },
      rinkeby: {
        address: '0x53EcA61358Bb949F1A70E92142eb1974Fb3cB298',
      },
      kovan: {
        address: '0x276e1fdB65951B8c1d1c16C5B69a72bE3060E7AA',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
  },
  GriefingAgreement: {
    factory: {
      artifact: require('../build/ErasureFactory.json'),
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
    template: {
      artifact: require('../build/GriefingAgreement.json'),
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
  },
  GriefingEscrow: {
    factory: {
      artifact: require('../build/ErasureFactory.json'),
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
    template: {
      artifact: require('../build/GriefingEscrow.json'),
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
      kovan: {
        address: '',
      },
    },
  },
}

module.exports = contracts
