const Contracts = {
    NMR: {
        artifact: require("./abis/MockNMR.json"),
        mainnetAddress: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
        rinkebyAddress: "0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373"
    },
    Erasure_Agreements: {
        artifact: require("./abis/Erasure_Agreements.json"),
        mainnetAddress: "0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF",
        rinkebyAddress: "0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC"
    },
    Erasure_Posts: {
        artifact: require("./abis/Erasure_Posts.json"),
        mainnetAddress: "0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29",
        rinkebyAddress: "0x57EB544cCA126D356FFe19D732A79Db494ba09b1"
    },
    Erasure_Users: {
        artifact: require("./abis/Erasure_Users.json"),
        mainnetAddress: "0x789D0082B20A929D6fB64EB4c10c68e827AAB7aB",
        rinkebyAddress: "0xbF7339e68b81a1261FDF46FDBe916cd88f3609c0"
    },
    Post_Factory: {
        artifact: require("./abis/Post_Factory.json"),
        mainnetAddress: "0x41b65f0153410E42ec26eaBa71F9f8f133282B54",
        rinkebyAddress: "0xbd1E2C679ED25485e27e5AD8eD3a2776769d22aF"
    },
    Post: {
        artifact: require("./abis/Post.json"),
        mainnetAddress: "0x7f858F0726af676e00cB76459D984463ee1307c2",
        rinkebyAddress: "0x223EbC4e00eD605cC580E6B547aDbf7300B4BF4D"
    
    },
    FeedFactory: {
        artifact: require("./abis/Feed_Factory.json"),
        mainnetAddress: "0x206780873974878722Ed156544589701832eE920",
        rinkebyAddress: "0xa3140871346f4efF924dc874EC6AfD4573232F03"
    },
    Feed: {
        artifact: require("./abis/Feed.json"),
        mainnetAddress: "0xA411eB36538a2Ae060A766221E43A94205460369",
        rinkebyAddress: "0x7aA06aa3b6D5476c0CE720231E2Add74164f78CD"
    },
    SimpleGriefingFactory: {
        artifact: require("./abis/SimpleGriefing_Factory.json"),
        mainnetAddress: "0x67ef9503cf0350dB52130Ef2Ad053E868Bc90FC7",
        rinkebyAddress: "0x896E5C478c297092965441A62d0a0B0A4A4CC6E8"
    },
    SimpleGriefing: {
        artifact: require("./abis/SimpleGriefing.json"),
        mainnetAddress: "0xC04Bd2f0d484b7e0156b21c98B2923Ca8b9ce149",
        rinkebyAddress: "0x183347dA3DABb0F8a43a49E4Df93C957030f6780"
    },
    CountdownGriefingFactory: {
        artifact: require("./abis/CountdownGriefing_Factory.json"),
        mainnetAddress: "0xd330e5e9670738D36E31dcb1fde0c08B1895a0b1",
        rinkebyAddress: "0xab005C507c877696033e60BB99cAc9B9ADD6A741"
    },
    CountdownGriefing: {
        artifact: require("./abis/CountdownGriefing.json"),
        mainnetAddress: "0x89a2958544f86Cc57828dbBf31E2C786f20Fe0a0",
        rinkebyAddress: "0xb84d62fbd39bf3504d197D2405FCD5b86427D35B"
    }
};
module.exports = Contracts;
