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

// global

var g = {};

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
    const ratioType = 2;
    const encryptedData = '0x12341234123412341234';

    // ABICoder
    const AbiCoder = new ethers.utils.AbiCoder();

    before(async function () {

        // setup deployment
        [g.deployer, g.MockNMR] = await setupDeployment();
        [g.deployer, g.MockNMR] = await initDeployment();

        // deploy registry contracts
        g.Registry = await g.deployer.deploy(Registry_Artifact);
        g.AgreementRegistry = await g.deployer.deploy(AgreementRegistry_Artifact);

        // deploy template contracts
        g.Template = await g.deployer.deploy(Template_Artifact);
        g.AgreementTemplate = await g.deployer.deploy(AgreementTemplate_Artifact);

        // deploy factory contracts
        g.Factory = await g.deployer.deploy(
            Factory_Artifact,
            false,
            g.Registry.contractAddress,
            g.Template.contractAddress
        );
        g.AgreementFactory = await g.deployer.deploy(
            AgreementFactory_Artifact,
            false,
            g.AgreementRegistry.contractAddress,
            g.AgreementTemplate.contractAddress
        );

        // register factories in registries
        const abiCodedAddress = AbiCoder.encode(['address'], [g.AgreementFactory.contractAddress]);
        await g.Registry.from(g.deployer.signer).addFactory(
            g.Factory.contractAddress,
            abiCodedAddress
        );
        await g.AgreementRegistry.from(g.deployer.signer).addFactory(
            g.AgreementFactory.contractAddress,
            "0x"
        );

        // snapshot state
        g.initSnapshot = await utils.snapshot(g.deployer.provider);

    });

    async function createEscrow(_creator, _buyer, _seller, _operator) {

        // encode initialization variables into calldata

        const agreementTypes = ["uint120", "uint8", "uint128"];
        const agreementParams = [griefRatio, ratioType, agreementCountdown];
        const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

        let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
        let initParams = [_buyer, _seller, _operator, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
        const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

        // deploy escrow contract

        let events = {};

        const tx = await g.Factory.from(_creator).create(calldata);
        const receipt = await g.Factory.verboseWaitForTransaction(tx);

        // get escrow contract

        [events.InstanceCreated] = utils.parseLogs(receipt, g.Factory, "InstanceCreated");
        const instanceAddress = events.InstanceCreated.instance;

        g.Instance = g.deployer.wrapDeployedContract(
            Template_Artifact,
            instanceAddress
        );

        // validate events

        [events.Initialized] = utils.parseLogs(receipt, g.Instance, "Initialized");

        assert.equal(events.Initialized.buyer, _buyer);
        assert.equal(events.Initialized.seller, _seller);
        assert.equal(events.Initialized.operator, _operator);
        assert.equal(events.Initialized.paymentAmount.toString(), paymentAmount.toString());
        assert.equal(events.Initialized.stakeAmount.toString(), stakeAmount.toString());
        assert.equal(events.Initialized.countdownLength, escrowCountdown);
        assert.equal(events.Initialized.metadata, "0x");
        assert.equal(events.Initialized.agreementParams, encodedParams);

        // validate state change

        assert.equal((await g.Instance.getBuyer()), _buyer);
        assert.equal((await g.Instance.isBuyer(_buyer)), true);
        assert.equal((await g.Instance.getSeller()), _seller);
        assert.equal((await g.Instance.isSeller(_seller)), true);
        assert.equal((await g.Instance.getOperator()), _operator);
        assert.equal((await g.Instance.isOperator(_operator)), true);
        assert.equal((await g.Instance.hasActiveOperator()), false);
        assert.equal((await g.Instance.isActiveOperator(_operator)), false);
        assert.equal((await g.Instance.getLength()), escrowCountdown);
        assert.equal((await g.Instance.getEscrowStatus()), 0);

        const data = await g.Instance.getData();
        assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
        assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
        assert.equal(data.status, 0);
        assert.equal(data.ratio.toString(), griefRatio.toString());
        assert.equal(data.ratioType, 2);
        assert.equal(data.countdownLength, agreementCountdown);

    };

    async function depositPayment(_buyer) {

        // mint tokens 

        await g.MockNMR.mintMockTokens(_buyer, paymentAmount);
        await g.MockNMR.from(_buyer).approve(g.Instance.contractAddress, paymentAmount);

        // deposit NMR in the escrow

        const depositTx = await g.Instance.from(_buyer).depositPayment();
        const receipt = await g.Instance.verboseWaitForTransaction(depositTx);

        let events = {};

        // validate events

        [events.PaymentDeposited] = utils.parseLogs(receipt, g.Instance, "PaymentDeposited");
        [events.StakeAdded] = utils.parseLogs(receipt, g.Instance, "StakeAdded");
        [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");

        assert.equal(events.PaymentDeposited.buyer, _buyer);
        assert.equal(events.PaymentDeposited.amount.toString(), paymentAmount.toString());
        assert.equal(events.StakeAdded.staker, _buyer);
        assert.equal(events.StakeAdded.funder, _buyer);
        assert.equal(events.StakeAdded.amount.toString(), paymentAmount.toString());
        assert.equal(events.StakeAdded.newStake.toString(), paymentAmount.toString());
        assert.equal(events.Transfer.from, _buyer);
        assert.equal(events.Transfer.to, g.Instance.contractAddress);
        assert.equal(events.Transfer.value.toString(), paymentAmount.toString());

        // validate state change

        assert.equal((await g.Instance.getBuyer()), _buyer);
        assert.equal((await g.Instance.isBuyer(_buyer)), true);
        assert.equal((await g.Instance.getStake(_buyer)).toString(), paymentAmount.toString());
        assert.equal((await g.Instance.isStakeDeposited()), false);
        assert.equal((await g.Instance.isPaymentDeposited()), true);
        assert.equal((await g.Instance.isDeposited()), false);
        assert.equal((await g.Instance.getEscrowStatus()), 0);

    };

    async function depositStake(_seller) {

        // mint tokens 

        await g.MockNMR.mintMockTokens(_seller, stakeAmount);
        await g.MockNMR.from(_seller).approve(g.Instance.contractAddress, stakeAmount);

        // deposit NMR in the escrow

        const depositTx = await g.Instance.from(_seller).depositStake();
        const receipt = await g.Instance.verboseWaitForTransaction(depositTx);

        let events = {};

        // validate events

        [events.StakeDeposited] = utils.parseLogs(receipt, g.Instance, "StakeDeposited");
        [events.StakeAdded] = utils.parseLogs(receipt, g.Instance, "StakeAdded");
        [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");

        assert.equal(events.StakeDeposited.seller, _seller);
        assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
        assert.equal(events.StakeAdded.staker, _seller);
        assert.equal(events.StakeAdded.funder, _seller);
        assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
        assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
        assert.equal(events.Transfer.from, _seller);
        assert.equal(events.Transfer.to, g.Instance.contractAddress);
        assert.equal(events.Transfer.value.toString(), stakeAmount.toString());

        // validate state change

        assert.equal((await g.Instance.getSeller()), _seller);
        assert.equal((await g.Instance.isSeller(_seller)), true);
        assert.equal((await g.Instance.getStake(_seller)).toString(), stakeAmount.toString());
        assert.equal((await g.Instance.isStakeDeposited()), true);
        assert.equal((await g.Instance.isPaymentDeposited()), false);
        assert.equal((await g.Instance.isDeposited()), false);
        assert.equal((await g.Instance.getEscrowStatus()), 0);

    };

    async function submitData(_seller) {

        // send data into escrow 

        let events = {};
        const tx = await g.Instance.from(_seller).submitData(encryptedData);
        const receipt = await g.Instance.verboseWaitForTransaction(tx);

        // validate events

        [events.DataSubmitted] = utils.parseLogs(receipt, g.Instance, "DataSubmitted");

        assert.equal(events.DataSubmitted.data, encryptedData);

    };

    describe("Requester", async function () {
        describe("Requester Happy Path", async function () {
            it("requester should successfully create escrow", async function () {

                // revert contract state

                await utils.revertState(g.deployer.provider, g.initSnapshot);

                // create escrow

                await createEscrow(requester, requester, ethers.constants.AddressZero, ethers.constants.AddressZero);

            });

            it("requester should successfully deposit payment", async function () {

                // deposit payment

                await depositPayment(requester);

            });

            it("fulfiller should successfully deposit stake and finalize", async function () {

                // mint tokens 

                await g.MockNMR.mintMockTokens(fulfiller, stakeAmount);
                await g.MockNMR.from(fulfiller).approve(g.Instance.contractAddress, stakeAmount);

                // deposit NMR in the escrow

                const depositTx = await g.Instance.from(fulfiller).depositStake();
                const receipt = await g.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // get agreement contract

                [events.InstanceCreated] = utils.parseLogs(receipt, g.AgreementFactory, "InstanceCreated");
                const instanceAddress = events.InstanceCreated.instance;

                g.AgreementInstance = g.deployer.wrapDeployedContract(
                    AgreementTemplate_Artifact,
                    instanceAddress
                );

                // validate events

                [events.StakeDeposited] = utils.parseLogs(receipt, g.Instance, "StakeDeposited");
                [events.StakeAdded] = utils.parseLogs(receipt, g.Instance, "StakeAdded");
                events.Transfer = utils.parseLogs(receipt, g.MockNMR, "Transfer");
                events.StakeRemoved = utils.parseLogs(receipt, g.Instance, "StakeRemoved");
                [events.Finalized] = utils.parseLogs(receipt, g.Instance, "Finalized");
                [events.Initialized] = utils.parseLogs(receipt, g.AgreementInstance, "Initialized");

                assert.equal(events.StakeDeposited.seller, fulfiller);
                assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.staker, fulfiller);
                assert.equal(events.StakeAdded.funder, fulfiller);
                assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
                assert.equal(events.Transfer[0].from, fulfiller);
                assert.equal(events.Transfer[0].to, g.Instance.contractAddress);
                assert.equal(events.Transfer[0].value.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[0].staker, requester);
                assert.equal(events.StakeRemoved[0].amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved[0].newStake.toNumber(), 0);
                assert.equal(events.StakeRemoved[1].staker, fulfiller);
                assert.equal(events.StakeRemoved[1].amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[1].newStake.toNumber(), 0);
                assert.equal(events.Transfer[1].from, g.Instance.contractAddress);
                assert.equal(events.Transfer[1].to, g.AgreementInstance.contractAddress);
                assert.equal(events.Transfer[1].value.toString(), stakeAmount.add(paymentAmount).toString());
                assert.equal(events.Finalized.agreement, g.AgreementInstance.contractAddress);
                assert.equal(events.Initialized.operator, g.Instance.contractAddress);
                assert.equal(events.Initialized.staker, fulfiller);
                assert.equal(events.Initialized.counterparty, requester);
                assert.equal(events.Initialized.ratio.toString(), griefRatio.toString());
                assert.equal(events.Initialized.ratioType, ratioType);
                assert.equal(events.Initialized.countdownLength, agreementCountdown);
                assert.equal(events.Initialized.metadata, "0x");

                // validate state change

                assert.equal((await g.Instance.getSeller()), fulfiller);
                assert.equal((await g.Instance.isSeller(fulfiller)), true);
                assert.equal((await g.Instance.getStake(fulfiller)).toNumber(), 0);
                assert.equal((await g.Instance.getBuyer()), requester);
                assert.equal((await g.Instance.isBuyer(requester)), true);
                assert.equal((await g.Instance.getStake(requester)).toNumber(), 0);
                assert.equal((await g.Instance.isStakeDeposited()), true);
                assert.equal((await g.Instance.isPaymentDeposited()), true);
                assert.equal((await g.Instance.getEscrowStatus()), 2);

            });

            it("fulfiller should successfully submit data", async function () {

                // submit data
                await submitData(fulfiller);

            });
        });

        describe("Requester finds no Fulfiller", function () {

            it("requester should successfully create escrow", async function () {

                // revert contract state

                await utils.revertState(g.deployer.provider, g.initSnapshot);

                // create escrow

                await createEscrow(requester, requester, ethers.constants.AddressZero, ethers.constants.AddressZero);

            });

            it("requester should successfully deposit payment", async function () {

                // deposit payment

                await depositPayment(requester);

            });

            it("requester should successfully cancel escrow", async function () {

                // cancel escrow

                let events = {};
                const tx = await g.Instance.from(requester).cancel();
                const receipt = await g.Instance.verboseWaitForTransaction(tx);

                // validate events

                assert.equal(utils.hasEvent(receipt, g.Instance, "Cancelled"), true);
                [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");
                [events.StakeRemoved] = utils.parseLogs(receipt, g.Instance, "StakeRemoved");
                [events.StakeTaken] = utils.parseLogs(receipt, g.Instance, "StakeTaken");

                assert.equal(events.Transfer.from, g.Instance.contractAddress);
                assert.equal(events.Transfer.to, requester);
                assert.equal(events.Transfer.value.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved.staker, requester);
                assert.equal(events.StakeRemoved.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved.newStake.toNumber(), 0);
                assert.equal(events.StakeTaken.staker, requester);
                assert.equal(events.StakeTaken.recipient, requester);
                assert.equal(events.StakeTaken.amount.toString(), paymentAmount.toString());

                // validate state change

                assert.equal((await g.Instance.getStake(requester)).toNumber(), 0);
                assert.equal((await g.Instance.getEscrowStatus()), 3);
                assert.equal((await g.Instance.isPaymentDeposited()), true);

            });
        });
    });

    describe("Seller", function () {
        describe("Seller Happy Path", function () {
            it("seller should successfully create escrow", async function () {

                // revert contract state

                await utils.revertState(g.deployer.provider, g.initSnapshot);

                // create escrow

                await createEscrow(seller, ethers.constants.AddressZero, seller, ethers.constants.AddressZero);

            });

            it("seller should successfully deposit stake", async function () {

                // deposit stake

                await depositStake(seller);

            });

            it("buyer should successfully fulfill request and trigger countdown", async function () {

                // mint tokens 

                await g.MockNMR.mintMockTokens(buyer, paymentAmount);
                await g.MockNMR.from(buyer).approve(g.Instance.contractAddress, paymentAmount);

                // deposit NMR in the escrow

                const depositTx = await g.Instance.from(buyer).depositPayment();
                const receipt = await g.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.PaymentDeposited] = utils.parseLogs(receipt, g.Instance, "PaymentDeposited");
                [events.StakeAdded] = utils.parseLogs(receipt, g.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");

                assert.equal(events.PaymentDeposited.buyer, buyer);
                assert.equal(events.PaymentDeposited.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.staker, buyer);
                assert.equal(events.StakeAdded.funder, buyer);
                assert.equal(events.StakeAdded.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), paymentAmount.toString());
                assert.equal(events.Transfer.from, buyer);
                assert.equal(events.Transfer.to, g.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), paymentAmount.toString());
                assert.equal(utils.hasEvent(receipt, g.Instance, "DeadlineSet"), true);

                // validate state change

                assert.equal((await g.Instance.getBuyer()), buyer);
                assert.equal((await g.Instance.isBuyer(buyer)), true);
                assert.equal((await g.Instance.getStake(buyer)).toString(), paymentAmount.toString());
                assert.equal((await g.Instance.isStakeDeposited()), true);
                assert.equal((await g.Instance.isPaymentDeposited()), true);
                assert.equal((await g.Instance.isDeposited()), true);
                assert.equal((await g.Instance.getEscrowStatus()), 1);
                assert.equal((await g.Instance.getCountdownStatus()), 2);

            });

            it("seller should successfully finalize", async function () {

                // finalize

                const tx = await g.Instance.from(seller).finalize();
                const receipt = await g.Instance.verboseWaitForTransaction(tx);

                let events = {};

                // get agreement contract

                [events.InstanceCreated] = utils.parseLogs(receipt, g.AgreementFactory, "InstanceCreated");
                const instanceAddress = events.InstanceCreated.instance;

                g.AgreementInstance = g.deployer.wrapDeployedContract(
                    AgreementTemplate_Artifact,
                    instanceAddress
                );

                // validate events

                [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");
                events.StakeRemoved = utils.parseLogs(receipt, g.Instance, "StakeRemoved");
                [events.Finalized] = utils.parseLogs(receipt, g.Instance, "Finalized");
                [events.Initialized] = utils.parseLogs(receipt, g.AgreementInstance, "Initialized");

                assert.equal(events.Transfer.from, g.Instance.contractAddress);
                assert.equal(events.Transfer.to, g.AgreementInstance.contractAddress);
                assert.equal(events.Transfer.value.toString(), stakeAmount.add(paymentAmount).toString());
                assert.equal(events.StakeRemoved[0].staker, buyer);
                assert.equal(events.StakeRemoved[0].amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved[0].newStake.toNumber(), 0);
                assert.equal(events.StakeRemoved[1].staker, seller);
                assert.equal(events.StakeRemoved[1].amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[1].newStake.toNumber(), 0);
                assert.equal(events.Finalized.agreement, g.AgreementInstance.contractAddress);
                assert.equal(events.Initialized.operator, g.Instance.contractAddress);
                assert.equal(events.Initialized.staker, seller);
                assert.equal(events.Initialized.counterparty, buyer);
                assert.equal(events.Initialized.ratio.toString(), griefRatio.toString());
                assert.equal(events.Initialized.ratioType, ratioType);
                assert.equal(events.Initialized.countdownLength, agreementCountdown);
                assert.equal(events.Initialized.metadata, "0x");

                // validate state change

                assert.equal((await g.Instance.getSeller()), seller);
                assert.equal((await g.Instance.isSeller(seller)), true);
                assert.equal((await g.Instance.getStake(seller)).toNumber(), 0);
                assert.equal((await g.Instance.getBuyer()), buyer);
                assert.equal((await g.Instance.isBuyer(buyer)), true);
                assert.equal((await g.Instance.getStake(buyer)).toNumber(), 0);
                assert.equal((await g.Instance.isStakeDeposited()), true);
                assert.equal((await g.Instance.isPaymentDeposited()), true);
                assert.equal((await g.Instance.getEscrowStatus()), 2);

            });

            it("seller should successfully submit the data", async function () {

                // submit data
                await submitData(seller);

            });
        });
        describe("Seller finds no Buyer", function () {
            it("seller should successfully create escrow", async function () {

                // revert contract state

                await utils.revertState(g.deployer.provider, g.initSnapshot);

                // create escrow

                await createEscrow(seller, ethers.constants.AddressZero, seller, ethers.constants.AddressZero);

            });

            it("seller should successfully deposit stake", async function () {

                // deposit stake

                await depositStake(seller);

            });

            it("seller should successfully cancel", async function () {

                // cancel escrow

                let events = {};
                const tx = await g.Instance.from(seller).cancel();
                const receipt = await g.Instance.verboseWaitForTransaction(tx);

                // validate events

                assert.equal(utils.hasEvent(receipt, g.Instance, "Cancelled"), true);
                [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");
                [events.StakeRemoved] = utils.parseLogs(receipt, g.Instance, "StakeRemoved");
                [events.StakeTaken] = utils.parseLogs(receipt, g.Instance, "StakeTaken");

                assert.equal(events.Transfer.from, g.Instance.contractAddress);
                assert.equal(events.Transfer.to, seller);
                assert.equal(events.Transfer.value.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved.staker, seller);
                assert.equal(events.StakeRemoved.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved.newStake.toNumber(), 0);
                assert.equal(events.StakeTaken.staker, seller);
                assert.equal(events.StakeTaken.recipient, seller);
                assert.equal(events.StakeTaken.amount.toString(), stakeAmount.toString());

                // validate state change

                assert.equal((await g.Instance.getStake(seller)).toNumber(), 0);
                assert.equal((await g.Instance.getEscrowStatus()), 3);
                assert.equal((await g.Instance.isStakeDeposited()), true);

            });
        });

        describe("Seller does not finalize sale", function () {
            it("seller should successfully create escrow", async function () {

                // revert contract state

                await utils.revertState(g.deployer.provider, g.initSnapshot);

                // create escrow

                await createEscrow(seller, ethers.constants.AddressZero, seller, ethers.constants.AddressZero);

            });

            it("seller should successfully deposit stake", async function () {

                // deposit stake

                await depositStake(seller);

            });

            it("buyer should successfully fulfill request and trigger countdown", async function () {

                // mint tokens 

                await g.MockNMR.mintMockTokens(buyer, paymentAmount);
                await g.MockNMR.from(buyer).approve(g.Instance.contractAddress, paymentAmount);

                // deposit NMR in the escrow

                const depositTx = await g.Instance.from(buyer).depositPayment();
                const receipt = await g.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.PaymentDeposited] = utils.parseLogs(receipt, g.Instance, "PaymentDeposited");
                [events.StakeAdded] = utils.parseLogs(receipt, g.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(receipt, g.MockNMR, "Transfer");

                assert.equal(events.PaymentDeposited.buyer, buyer);
                assert.equal(events.PaymentDeposited.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.staker, buyer);
                assert.equal(events.StakeAdded.funder, buyer);
                assert.equal(events.StakeAdded.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), paymentAmount.toString());
                assert.equal(events.Transfer.from, buyer);
                assert.equal(events.Transfer.to, g.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), paymentAmount.toString());
                assert.equal(utils.hasEvent(receipt, g.Instance, "DeadlineSet"), true);

                // validate state change

                assert.equal((await g.Instance.getBuyer()), buyer);
                assert.equal((await g.Instance.isBuyer(buyer)), true);
                assert.equal((await g.Instance.getStake(buyer)).toString(), paymentAmount.toString());
                assert.equal((await g.Instance.isStakeDeposited()), true);
                assert.equal((await g.Instance.isPaymentDeposited()), true);
                assert.equal((await g.Instance.isDeposited()), true);
                assert.equal((await g.Instance.getEscrowStatus()), 1);
                assert.equal((await g.Instance.getCountdownStatus()), 2);

            });

            it("buyer should successfully cancel", async function () {

                // time travel

                await utils.timeTravel(g.deployer.provider, escrowCountdown);

                // cancel escrow

                let events = {};
                const tx = await g.Instance.from(buyer).cancel();
                const receipt = await g.Instance.verboseWaitForTransaction(tx);

                // validate events

                assert.equal(utils.hasEvent(receipt, g.Instance, "Cancelled"), true);
                events.Transfer = utils.parseLogs(receipt, g.MockNMR, "Transfer");
                events.StakeRemoved = utils.parseLogs(receipt, g.Instance, "StakeRemoved");
                events.StakeTaken = utils.parseLogs(receipt, g.Instance, "StakeTaken");

                assert.equal(events.Transfer[0].from, g.Instance.contractAddress);
                assert.equal(events.Transfer[0].to, seller);
                assert.equal(events.Transfer[0].value.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[0].staker, seller);
                assert.equal(events.StakeRemoved[0].amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[0].newStake.toNumber(), 0);
                assert.equal(events.StakeTaken[0].staker, seller);
                assert.equal(events.StakeTaken[0].recipient, seller);
                assert.equal(events.StakeTaken[0].amount.toString(), stakeAmount.toString());
                assert.equal(events.Transfer[1].from, g.Instance.contractAddress);
                assert.equal(events.Transfer[1].to, buyer);
                assert.equal(events.Transfer[1].value.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved[1].staker, buyer);
                assert.equal(events.StakeRemoved[1].amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved[1].newStake.toNumber(), 0);
                assert.equal(events.StakeTaken[1].staker, buyer);
                assert.equal(events.StakeTaken[1].recipient, buyer);
                assert.equal(events.StakeTaken[1].amount.toString(), paymentAmount.toString());

                // validate state change

                assert.equal((await g.Instance.getStake(seller)).toNumber(), 0);
                assert.equal((await g.Instance.getStake(buyer)).toNumber(), 0);
                assert.equal((await g.Instance.getEscrowStatus()), 3);
                assert.equal((await g.Instance.isStakeDeposited()), true);
                assert.equal((await g.Instance.isPaymentDeposited()), true);

            });
        });
    });
});
