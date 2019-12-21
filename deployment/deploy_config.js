const c = {
  NMR: {
    artifact: require('../build/MockNMR.json'),
    mainnet: {
      address: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
    },
    rinkeby: {
      address: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
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
  },
  Erasure_Posts: {
    artifact: require('../build/Erasure_Posts.json'),
    mainnet: {
      address: '0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29',
    },
    rinkeby: {
      address: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
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
  },
  Erasure_Escrows: {
    artifact: require('../build/Erasure_Escrows.json'),
    mainnet: {
      address: '0x409EA12E73a10EF166bc063f94Aa9bc952835E93',
    },
    rinkeby: {
      address: '0xFD6a8b50B7D97133B03f48a08E9BEF5f664e092c',
    },
  },
  Feed: {
    factory: {
      artifact: require('../build/Feed_Factory.json'),
      mainnet: {
        address: '0xEF078E8330f99186079BE1d2ee6b4a5d6f23E8F1',
      },
      rinkeby: {
        address: '0x241795381CE24bf3Ea7721778a5Ec66b43a915DF',
      },
    },
    template: {
      artifact: require('../build/Feed.json'),
      mainnet: {
        address: '0xea14477b327B9E4be4cdfBcE2df04C09F7D2a196',
      },
      rinkeby: {
        address: '0xFF1A286A98d29f59B91328F2228e4511db39a4a1',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
    },
  },
  SimpleGriefing: {
    factory: {
      artifact: require('../build/SimpleGriefing_Factory.json'),
      mainnet: {
        address: '0x474C80E1e6Bfd3283c9F31979AAc920A0F89a7AA',
      },
      rinkeby: {
        address: '0x9B8F36CEa9F84178BC5F31fBF836e8E8058577Af',
      },
    },
    template: {
      artifact: require('../build/SimpleGriefing.json'),
      mainnet: {
        address: '0x210fF9Ced719E9bf2444DbC3670BAC99342126fA',
      },
      rinkeby: {
        address: '0x8eEC9425bed0B6A35AD5922afF688b14dBF9EefF',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
    },
  },
  CountdownGriefing: {
    factory: {
      artifact: require('../build/CountdownGriefing_Factory.json'),
      mainnet: {
        address: '0x053624bd3BA5a3F5b2246A44d2794b5152a6032B',
      },
      rinkeby: {
        address: '0xCAE071401c9e6a5880b47f79b7aCD1d972eAb0E0',
      },
    },
    template: {
      artifact: require('../build/CountdownGriefing.json'),
      mainnet: {
        address: '0xCA276Ef1810E6d40c3A8B6cd02bd10fE2f098936',
      },
      rinkeby: {
        address: '0xbb76fDB45025587fceAC489CF9259285c6962A33',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
    },
  },
  CountdownGriefingEscrow: {
    factory: {
      artifact: require('../build/CountdownGriefingEscrow_Factory.json'),
      mainnet: {
        address: '0xC5E1169F69D744F6CECEA47a50A66bE7E41e0460',
      },
      rinkeby: {
        address: '0xca851A27C03FDb70D9468372d852D39a5830945b',
      },
    },
    template: {
      artifact: require('../build/CountdownGriefingEscrow.json'),
      mainnet: {
        address: '0x8AF5db2d758071A3c48AC12eC4F081857Fd0cef4',
      },
      rinkeby: {
        address: '0x4E122d8f121E137BDBb63ADEa0E12895fa46c349',
      },
    },
    instance: {
      mainnet: {
        address: '',
      },
      rinkeby: {
        address: '',
      },
    },
  },
}

module.exports = { c }
