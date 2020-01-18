const Contracts = {
  NMR: {
    artifact: require('./abis/MockNMR.json'),
    mainnetAddress: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
    rinkebyAddress: '0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373',
    kovanAddress: '0xe9E2dF04e6d699986A5E0f131Eb37aAAd4BA2bdC',
  },
  DAI: {
    artifact: require('./abis/MockERC20.json'),
    mainnetAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    rinkebyAddress: '0x2448eE2641d78CC42D7AD76498917359D961A783',
    kovanAddress: '0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
  },
  Erasure_Agreements: {
    artifact: require('./abis/Erasure_Agreements.json'),
    mainnetAddress: '0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF',
    rinkebyAddress: '0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC',
    kovanAddress: '0x09f83e08CC9F41CE8bd901a214F36B2ba958D7eD',
  },
  Erasure_Posts: {
    artifact: require('./abis/Erasure_Posts.json'),
    mainnetAddress: '0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29',
    rinkebyAddress: '0x57EB544cCA126D356FFe19D732A79Db494ba09b1',
    kovanAddress: '0xB88336e7D856b55eCB1e7561d90e025386E8b3e3',
  },
  Erasure_Users: {
    artifact: require('./abis/Erasure_Users.json'),
    mainnetAddress: '0x789D0082B20A929D6fB64EB4c10c68e827AAB7aB',
    rinkebyAddress: '0xbF7339e68b81a1261FDF46FDBe916cd88f3609c0',
    kovanAddress: '0xf63ca73e164884793165EE908f216500e49Ad080',
  },
  Erasure_Escrows: {
    artifact: require('./abis/Erasure_Escrows.json'),
    mainnetAddress: '0x409EA12E73a10EF166bc063f94Aa9bc952835E93',
    rinkebyAddress: '0xFD6a8b50B7D97133B03f48a08E9BEF5f664e092c',
    kovanAddress: '0x0a726cD79a6E6c0eBeCeEAC8938C5922dc5dDd2B',
  },
  FeedFactory: {
    artifact: require('./abis/Feed_Factory.json'),
    mainnetAddress: '',
    rinkebyAddress: '0x4b81D52e3c196B1D6D445bd99d356A86Eb98e86E',
    kovanAddress: '0x3A1a3EfeDf5C3932Bac1b637EA8Ac2D904C58480',
  },
  Feed: {
    artifact: require('./abis/Feed.json'),
    mainnetAddress: '',
    rinkebyAddress: '0x53EcA61358Bb949F1A70E92142eb1974Fb3cB298',
    kovanAddress: '0x276e1fdB65951B8c1d1c16C5B69a72bE3060E7AA',
  },
  SimpleGriefingFactory: {
    artifact: require('./abis/SimpleGriefing_Factory.json'),
    mainnetAddress: '',
    rinkebyAddress: '0xD4817F7Ba9A518bB2abA008f0754f440529E6219',
    kovanAddress: '0xe1fE447275B02Cec4c36654E33D245Eb4a95fBE3',
  },
  SimpleGriefing: {
    artifact: require('./abis/SimpleGriefing.json'),
    mainnetAddress: '',
    rinkebyAddress: '0xA262EDBb8E74025BAD1D80ACF603D688d14e98b8',
    kovanAddress: '0x783E162F8597a0bdBC88af97Da14a4957Cc3a616',
  },
  CountdownGriefingFactory: {
    artifact: require('./abis/CountdownGriefing_Factory.json'),
    mainnetAddress: '',
    rinkebyAddress: '0xe7862De73fF5678251a6183e757AAbbe4F5AfA2C',
    kovanAddress: '0x10034DcE3D78168dc76c905EB3B3481E823DA48a',
  },
  CountdownGriefing: {
    artifact: require('./abis/CountdownGriefing.json'),
    mainnetAddress: '',
    rinkebyAddress: '0xafD67e6B6e29db30D59BE1dC31aa42cF531aC29F',
    kovanAddress: '0xc110156B813a122F5F4766937d8D54035A04fEB5',
  },
  CountdownGriefingEscrowFactory: {
    artifact: require('./abis/CountdownGriefingEscrow_Factory.json'),
    mainnetAddress: '',
    rinkebyAddress: '0x912FF45B8B3dad13E2E2EFD1414bFF811a87b548',
    kovanAddress: '0x2D1a2e0bB4a770d2257D02eCd60D730268F3dad6',
  },
  CountdownGriefingEscrow: {
    artifact: require('./abis/CountdownGriefingEscrow.json'),
    mainnetAddress: '',
    rinkebyAddress: '0xCc10AEB2a364f9873Ecb83Ed6DB7f6D7284d1446',
    kovanAddress: '0xc586D68F661C59320da5014A12Fde888b7696883',
  },
}
module.exports = Contracts
