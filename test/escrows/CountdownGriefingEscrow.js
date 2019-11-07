const etherlime = require("etherlime-lib");
const ethers = require("ethers");

const { setupDeployment, initDeployment } = require("../helpers/setup");
const {
    hexlify,
    createMultihashSha256,
    abiEncodeWithSelector,
    assertEvent
} = require("../helpers/utils");

const Template_Artifact = require("../../build/CountdownGriefingEscrow.json");
const Factory_Artifact = require("../../build/CountdownGriefingEscrow_Factory.json");
const Registry_Artifact = require("../../build/Erasure_Escrows.json");

const AgreementTemplate_Artifact = require("../../build/CountdownGriefing.json");
const AgreementFactory_Artifact = require("../../build/CountdownGriefing_Factory.json");
const AgreementRegistry_Artifact = require("../../build/Erasure_Agreements.json");

// artifacts

describe("CountdownGriefingEscrow", function () {

    // wallets and addresses
    const seller = accounts[0].signer.signingKey.address;
    const buyer = accounts[1].signer.signingKey.address;
    const requester = accounts[2].signer.signingKey.address;
    const fulfiller = accounts[3].signer.signingKey.address;

    // shared params
    const escrowCountdown = 2 * 24 * 60 * 60; // 2 days
    const agreementCountdown = 30 * 24 * 60 * 60; // 30 days
    const paymentAmount = ethers.utils.parseEther('2');
    const stakeAmount = ethers.utils.parseEther('1');
    const griefRatio = ethers.utils.parseEther('3');

    // ABICoder
    const AbiCoder = new ethers.utils.AbiCoder();

    before(async () => {

        // setup deployment context
        [this.deployer, this.MockNMR] = await setupDeployment();
        [this.deployer, this.MockNMR] = await initDeployment();

        // deploy registry contracts
        this.Registry = await this.deployer.deploy(Registry_Artifact);
        this.AgreementRegistry = await this.deployer.deploy(AgreementRegistry_Artifact);

        // deploy template contracts
        this.Template = await this.deployer.deploy(Template_Artifact);
        this.AgreementTemplate = await this.deployer.deploy(AgreementTemplate_Artifact);

        // deploy factory contracts
        this.Factory = await this.deployer.deploy(
            Factory_Artifact,
            false,
            this.Registry.contractAddress,
            this.Template.contractAddress
        );
        this.AgreementFactory = await this.deployer.deploy(
            AgreementFactory_Artifact,
            false,
            this.AgreementRegistry.contractAddress,
            this.AgreementTemplate.contractAddress
        );

        // register factories in registries
        const abiCodedAddress = AbiCoder.encode(['address'], [this.AgreementFactory.contractAddress]);
        await this.Registry.from(this.deployer.signer).addFactory(
            this.Factory.contractAddress,
            abiCodedAddress
        );
    });

    context("Seller", () => {
        context("Seller Happy Path", () => {

            it("seller should successfully create escrow", async () => {

                // encode initialization variables into calldata

                const agreementTypes = ["uint120", "uint8", "uint128"];
                const agreementParams = [griefRatio, 2, agreementCountdown];
                const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

                let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
                let initParams = [ethers.constants.AddressZero, seller, ethers.constants.AddressZero, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
                const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

                // deploy escrow contract

                let events = {};
                const tx = await this.Factory.create(calldata);
                const receipt = await this.Factory.verboseWaitForTransaction(tx);

                // get escrow contract

                [events.InstanceCreated] = utils.parseLogs(receipt, this.Factory, "InstanceCreated");
                const instanceAddress = events.InstanceCreated.instance;

                this.Instance = this.deployer.wrapDeployedContract(
                    Template_Artifact,
                    instanceAddress
                );

                // validate events

                [events.Initialized] = utils.parseLogs(receipt, this.Instance, "Initialized");

                assert.equal(events.Initialized.buyer, ethers.constants.AddressZero);
                assert.equal(events.Initialized.seller, seller);
                assert.equal(events.Initialized.operator, ethers.constants.AddressZero);
                assert.equal(events.Initialized.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(events.Initialized.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(events.Initialized.countdownLength, escrowCountdown);
                assert.equal(events.Initialized.metadata, "0x");
                assert.equal(events.Initialized.agreementParams, encodedParams);

                // validate state change

                assert.equal((await this.Instance.functions.getBuyer()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.functions.isBuyer(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.functions.getSeller()), seller);
                assert.equal((await this.Instance.functions.isSeller(seller)), true);
                assert.equal((await this.Instance.functions.getOperator()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.functions.isOperator(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.functions.hasActiveOperator()), false);
                assert.equal((await this.Instance.functions.isActiveOperator(ethers.constants.AddressZero)), false);
                assert.equal((await this.Instance.functions.getLength()), escrowCountdown);

                const data = await this.Instance.functions.getData();
                assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(data.status, 0);
                assert.equal(data.ratio.toString(), griefRatio.toString());
                assert.equal(data.ratioType, 2);
                assert.equal(data.countdownLength, agreementCountdown);

            });

            it("buyer should successfully put payment in escrow", async () => {
                // // send dai payment into escrow

                // Escrow.sendPayment();

            });

            it("seller should successfully send data", async () => {

                // // send data into escrow 

                // Escrow.sendData();

                // // execute escrow completion script
                // // - create the agreement
                // // - transfer stake to agreement
                // // - transfer payment to agreement
                // // - start agreement countdown

                // Escrow.executeOnCompletion();

            });

            it("buyer should successfully grief payment and stake", async () => {

                // // grief stake

                // Agreement.punish();

            });

            it("seller should successfully retrieve remaining payment and stake", async () => {
                // // time travel

                // // retrieve stake

                // Agreement.retrieveStake();
            });
        });
        context("Seller finds no Buyer", () => {
            it("seller should successfully upload data", async () => {
                // // create single post

                // Post_Factory.create();

                // // create escrow

                // Escrow_Factory.create();

                // // send nmr stake into escrow

                // Escrow.sendStake();

            });

            it("seller should successfully cancel escrow", async () => {
                // // time travel

                // // cancel escrow
                // // - return stake to seller

                // Escrow.cancel();

                // // execute escrow cancelation script

                // Escrow.executeOnCancelation();
            });
        });
        context("Seller doesn't send data", () => {
            it("seller should successfully upload data", async () => {
                // // create single post

                // Post_Factory.create();

                // // create escrow

                // Escrow_Factory.create();

                // // send nmr stake into escrow

                // Escrow.sendStake();

            });

            it("buyer should successfully put payment in escrow", async () => {
                // // send dai payment into escrow

                // Escrow.sendPayment();

            });

            it("seller should successfully cancel escrow", async () => {
                // // time travel

                // // cancel escrow

                // Escrow.cancel();

                // // execute escrow cancelation script
                // // - return stake to seller
                // // - return payment to buyer
                // // - close escrow

                // Escrow.executeOnCancelation();
            });
        });
    });

    context("Requester", () => {
        context("Requester Happy Path", () => {
            it("requester should successfully request data", async () => {
                // // create single post

                // Post_Factory.create();

                // // create escrow

                // Escrow_Factory.create();

                // // send dai payment into escrow

                // Escrow.sendPayment();
            });

            it("fulfiller should successfully fulfill request", async () => {

                // // send stake into escrow 

                // Escrow.sendStake();

                // // create single post

                // Post_Factory.create();

                // // send data into escrow 

                // Escrow.sendData();

                // // execute escrow completion script
                // // - create the agreement
                // // - transfer stake to agreement
                // // - transfer payment to agreement
                // // - start agreement countdown
                // // - close escrow

                // Escrow.executeOnCompletion();
            });

            it("requester should successfully grief payment and stake", async () => {
                // // grief stake

                // Agreement.punish();
            });

            it("fulfiller should successfully retrieve remaining payment and stake", async () => {
                // // time travel

                // // retrieve stake

                // Agreement.retrieveStake();
            });
        });
        context("Requester finds no Fulfiller", () => {
            it("requester should successfully request data", async () => {
                // // create single post

                // Post_Factory.create();

                // // create escrow

                // Escrow_Factory.create();

                // // send dai payment into escrow

                // Escrow.sendPayment();
            });

            it("requester should successfully cancel escrow", async () => {
                // // time travel

                // // cancel escrow

                // Escrow.cancel();

                // // execute escrow cancelation script
                // // - return payment to requester
                // // - close escrow

                // Escrow.executeOnCancelation();
            });
        });
    });
});
