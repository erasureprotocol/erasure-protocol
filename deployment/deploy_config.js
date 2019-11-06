const c = {
    NMR: {
        artifact: require("../build/MockNMR.json"),
        mainnet: {
            address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671"
        },
        rinkeby: {
            address: "0x1A758E75d1082BAab0A934AFC7ED27Dbf6282373"
        }
    },
    Erasure_Agreements: {
        artifact: require("../build/Erasure_Agreements.json"),
        mainnet: {
            address: "0xa6cf4Bf00feF8866e9F3f61C972bA7C687C6eDbF"
        },
        rinkeby: {
            address: "0xf46D714e39b742E22eB0363FE5D727E3C0a8BEcC"
        }
    },
    Erasure_Posts: {
        artifact: require("../build/Erasure_Posts.json"),
        mainnet: {
            address: "0x348FA9DcFf507B81C7A1d7981244eA92E8c6Af29"
        },
        rinkeby: {
            address: "0x57EB544cCA126D356FFe19D732A79Db494ba09b1"
        }
    },
    Erasure_Escrows: {
        artifact: require("../build/Erasure_Escrows.json"),
        mainnet: {
            address: ""
        },
        rinkeby: {
            address: "0xA9FfF710c8687fF1a5bD8031225907917f03319A"
        }
    },
    SimpleGriefing: {
        factory: {
            artifact: require("../build/SimpleGriefing_Factory.json"),
            mainnet: {
                address: "0x67ef9503cf0350dB52130Ef2Ad053E868Bc90FC7"
            },
            rinkeby: {
                address: "0xe2940cfF284eaEB54caad6A0d7946657283375a1"
            }
        },
        template: {
            artifact: require("../build/SimpleGriefing.json"),
            mainnet: {
                address: "0xC04Bd2f0d484b7e0156b21c98B2923Ca8b9ce149"
            },
            rinkeby: {
                address: "0x5B0d1Db5f266E97f739685b788C5F1DE3E325b25"
            }
        },
        instance: {
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: ""
            }
        }
    },
    CountdownGriefing: {
        factory: {
            artifact: require("../build/CountdownGriefing_Factory.json"),
            mainnet: {
                address: "0xd330e5e9670738D36E31dcb1fde0c08B1895a0b1"
            },
            rinkeby: {
                address: "0x5B2fcD6264fCFF7803a99e262900214667B6C77C"
            }
        },
        template: {
            artifact: require("../build/CountdownGriefing.json"),
            mainnet: {
                address: "0x89a2958544f86Cc57828dbBf31E2C786f20Fe0a0"
            },
            rinkeby: {
                address: "	0xc5B883Db107Cc9927F9c6E18bc603A5d9FcE7074"
            }
        },
        instance: {
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: ""
            }
        }
    },
    Feed: {
        factory: {
            artifact: require("../build/Feed_Factory.json"),
            mainnet: {
                address: "0x206780873974878722Ed156544589701832eE920"
            },
            rinkeby: {
                address: "0xa3140871346f4efF924dc874EC6AfD4573232F03"
            }
        },
        template: {
            artifact: require("../build/Feed.json"),
            mainnet: {
                address: "0xA411eB36538a2Ae060A766221E43A94205460369"
            },
            rinkeby: {
                address: "0x7aA06aa3b6D5476c0CE720231E2Add74164f78CD"
            }
        },
        instance: {
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: ""
            }
        }
    },
    Post: {
        factory: {
            artifact: require("../build/Post_Factory.json"),
            mainnet: {
                address: "0x41b65f0153410E42ec26eaBa71F9f8f133282B54"
            },
            rinkeby: {
                address: "0xbd1E2C679ED25485e27e5AD8eD3a2776769d22aF"
            }
        },
        template: {
            artifact: require("../build/Post.json"),
            mainnet: {
                address: "0x7f858F0726af676e00cB76459D984463ee1307c2"
            },
            rinkeby: {
                address: "0x223EbC4e00eD605cC580E6B547aDbf7300B4BF4D"
            }
        },
        instance: {
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: ""
            }
        }
    },
    CountdownGriefingEscrow: {
        factory: {
            artifact: require("../build/CountdownGriefingEscrow_Factory.json"),
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: "0x3A7BD58D3f88130de6625878e9d25D5606359F04"
            }
        },
        template: {
            artifact: require("../build/CountdownGriefingEscrow.json"),
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: "0xCeE65b74f91996824Bb02721Bcf0281652031632"
            }
        },
        instance: {
            mainnet: {
                address: ""
            },
            rinkeby: {
                address: ""
            }
        }
    },
};

module.exports = { c };
