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
    const ratioType = 2;
    const encryptedData = '0x12341234123412341234';

    // ABICoder
    const AbiCoder = new ethers.utils.AbiCoder();

    before(async () => {

        // setup deployment describe
        [this.deployer, this.MockNMR] = await setupDeployment();
        [this.deployer, this.MockNMR] = await initDeployment();

        // deploy registry contracts
        this.Registry = await this.deployer.deploy(Registry_Artifact);
        this.AgreementRegistry = await this.deployer.deploy(AgreementRegistry_Artifact);

        // deploy template contracts
        this.Template = await this.deployer.deploy(Template_Artifact);
        this.AgreementTemplate = await this.deployer.deploy(AgreementTemplate_Artifact);

        // deploy factory contracts
        console.log('binding factory pre');

        this.Factory = await this.deployer.deploy(
            Factory_Artifact,
            false,
            this.Registry.contractAddress,
            this.Template.contractAddress
        );
        console.log('binding factory post');
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
        await this.AgreementRegistry.from(this.deployer.signer).addFactory(
            this.AgreementFactory.contractAddress,
            "0x"
        );

        // snapshot state
        this.initSnapshot = await utils.snapshot(this.deployer.provider);

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
        // console.log(this);

        console.log('user factory pre');
        const tx = await this.Factory.from(_creator).create(calldata);
        console.log('user factory post');
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

        assert.equal(events.Initialized.buyer, _buyer);
        assert.equal(events.Initialized.seller, _seller);
        assert.equal(events.Initialized.operator, _operator);
        assert.equal(events.Initialized.paymentAmount.toString(), paymentAmount.toString());
        assert.equal(events.Initialized.stakeAmount.toString(), stakeAmount.toString());
        assert.equal(events.Initialized.countdownLength, escrowCountdown);
        assert.equal(events.Initialized.metadata, "0x");
        assert.equal(events.Initialized.agreementParams, encodedParams);

        // validate state change

        assert.equal((await this.Instance.getBuyer()), _buyer);
        assert.equal((await this.Instance.isBuyer(_buyer)), true);
        assert.equal((await this.Instance.getSeller()), _seller);
        assert.equal((await this.Instance.isSeller(_seller)), true);
        assert.equal((await this.Instance.getOperator()), _operator);
        assert.equal((await this.Instance.isOperator(_operator)), true);
        assert.equal((await this.Instance.hasActiveOperator()), false);
        assert.equal((await this.Instance.isActiveOperator(_operator)), false);
        assert.equal((await this.Instance.getLength()), escrowCountdown);
        assert.equal((await this.Instance.getEscrowStatus()), 0);

        const data = await this.Instance.getData();
        assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
        assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
        assert.equal(data.status, 0);
        assert.equal(data.ratio.toString(), griefRatio.toString());
        assert.equal(data.ratioType, 2);
        assert.equal(data.countdownLength, agreementCountdown);

        return this.Instance;

    };

    async function depositPayment(_buyer) {

        // mint tokens 

        await this.MockNMR.mintMockTokens(requester, paymentAmount);

        // deposit NMR in the escrow

        const approveTx = await this.MockNMR.from(_buyer).approve(this.Instance.contractAddress, paymentAmount);
        const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
        const depositTx = await this.Instance.from(_buyer).depositPayment();
        const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

        let events = {};

        // validate events

        [events.PaymentDeposited] = utils.parseLogs(depositReceipt, this.Instance, "PaymentDeposited");
        [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
        [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

        assert.equal(events.PaymentDeposited.buyer, _buyer);
        assert.equal(events.PaymentDeposited.amount.toString(), paymentAmount.toString());
        assert.equal(events.StakeAdded.staker, _buyer);
        assert.equal(events.StakeAdded.funder, _buyer);
        assert.equal(events.StakeAdded.amount.toString(), paymentAmount.toString());
        assert.equal(events.StakeAdded.newStake.toString(), paymentAmount.toString());
        assert.equal(events.Transfer.from, _buyer);
        assert.equal(events.Transfer.to, this.Instance.contractAddress);
        assert.equal(events.Transfer.value.toString(), paymentAmount.toString());

        // validate state change

        assert.equal((await this.Instance.getBuyer()), _buyer);
        assert.equal((await this.Instance.isBuyer(_buyer)), true);
        assert.equal((await this.Instance.getStake(_buyer)).toString(), paymentAmount.toString());
        assert.equal((await this.Instance.isStakeDeposited()), false);
        assert.equal((await this.Instance.isPaymentDeposited()), true);
        assert.equal((await this.Instance.isDeposited()), false);
        assert.equal((await this.Instance.getEscrowStatus()), 0);

    };

    async function depositStake(_seller) {

        // mint tokens 

        await this.MockNMR.mintMockTokens(_seller, stakeAmount);

        // deposit NMR in the escrow

        const approveTx = await this.MockNMR.from(_seller).approve(this.Instance.contractAddress, stakeAmount);
        const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
        const depositTx = await this.Instance.from(_seller).depositPayment();
        const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

        let events = {};

        // validate events

        [events.StakeDeposited] = utils.parseLogs(depositReceipt, this.Instance, "StakeDeposited");
        [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
        [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

        assert.equal(events.StakeDeposited.seller, _seller);
        assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
        assert.equal(events.StakeAdded.staker, _seller);
        assert.equal(events.StakeAdded.funder, _seller);
        assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
        assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
        assert.equal(events.Transfer.from, _seller);
        assert.equal(events.Transfer.to, this.Instance.contractAddress);
        assert.equal(events.Transfer.value.toString(), stakeAmount.toString());

        // validate state change

        assert.equal((await this.Instance.getSeller()), _seller);
        assert.equal((await this.Instance.isSeller(_seller)), true);
        assert.equal((await this.Instance.getStake(_seller)).toString(), stakeAmount.toString());
        assert.equal((await this.Instance.isStakeDeposited()), true);
        assert.equal((await this.Instance.isPaymentDeposited()), false);
        assert.equal((await this.Instance.isDeposited()), false);
        assert.equal((await this.Instance.getEscrowStatus()), 0);

    };

    describe("Requester", async () => {
        describe("Requester Happy Path", async () => {
            it("requester should successfully create escrow", async () => {

                // revert contract state

                await utils.revertState(this.deployer.provider, this.initSnapshot);

                // create escrow

                this.Instance = await createEscrow(requester, requester, ethers.constants.AddressZero, ethers.constants.AddressZero);

            });

            it("requester should successfully deposit payment", async () => {

                // deposit payment

                await depositPayment(requester);

            });

            it("fulfiller should successfully deposit stake and finalize", async () => {

                // mint tokens 

                await this.MockNMR.mintMockTokens(fulfiller, stakeAmount);

                // deposit NMR in the escrow

                const approveTx = await this.MockNMR.from(fulfiller).approve(this.Instance.contractAddress, stakeAmount);
                const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
                const depositTx = await this.Instance.from(fulfiller).depositStake();
                const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // get agreement contract

                [events.InstanceCreated] = utils.parseLogs(depositReceipt, this.AgreementFactory, "InstanceCreated");
                const instanceAddress = events.InstanceCreated.instance;

                this.AgreementInstance = this.deployer.wrapDeployedContract(
                    AgreementTemplate_Artifact,
                    instanceAddress
                );

                // validate events

                [events.StakeDeposited] = utils.parseLogs(depositReceipt, this.Instance, "StakeDeposited");
                [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
                events.Transfer = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");
                events.StakeRemoved = utils.parseLogs(depositReceipt, this.Instance, "StakeRemoved");
                [events.Finalized] = utils.parseLogs(depositReceipt, this.Instance, "Finalized");
                [events.Initialized] = utils.parseLogs(depositReceipt, this.AgreementInstance, "Initialized");

                assert.equal(events.StakeDeposited.seller, fulfiller);
                assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.staker, fulfiller);
                assert.equal(events.StakeAdded.funder, fulfiller);
                assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
                assert.equal(events.Transfer[0].from, fulfiller);
                assert.equal(events.Transfer[0].to, this.Instance.contractAddress);
                assert.equal(events.Transfer[0].value.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[0].staker, requester);
                assert.equal(events.StakeRemoved[0].amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeRemoved[0].newStake.toNumber(), 0);
                assert.equal(events.StakeRemoved[1].staker, fulfiller);
                assert.equal(events.StakeRemoved[1].amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved[1].newStake.toNumber(), 0);
                assert.equal(events.Transfer[1].from, this.Instance.contractAddress);
                assert.equal(events.Transfer[1].to, this.AgreementInstance.contractAddress);
                assert.equal(events.Transfer[1].value.toString(), stakeAmount.add(paymentAmount).toString());
                assert.equal(events.Finalized.agreement, this.AgreementInstance.contractAddress);
                assert.equal(events.Initialized.operator, this.Instance.contractAddress);
                assert.equal(events.Initialized.staker, fulfiller);
                assert.equal(events.Initialized.counterparty, requester);
                assert.equal(events.Initialized.ratio.toString(), griefRatio.toString());
                assert.equal(events.Initialized.ratioType, ratioType);
                assert.equal(events.Initialized.countdownLength, agreementCountdown);
                assert.equal(events.Initialized.metadata, "0x");

                // validate state change

                assert.equal((await this.Instance.getSeller()), fulfiller);
                assert.equal((await this.Instance.isSeller(fulfiller)), true);
                assert.equal((await this.Instance.getStake(fulfiller)).toNumber(), 0);
                assert.equal((await this.Instance.getBuyer()), requester);
                assert.equal((await this.Instance.isBuyer(requester)), true);
                assert.equal((await this.Instance.getStake(requester)).toNumber(), 0);
                assert.equal((await this.Instance.isStakeDeposited()), true);
                assert.equal((await this.Instance.isPaymentDeposited()), true);
                assert.equal((await this.Instance.getEscrowStatus()), 2);

            });

            it("fulfiller should successfully submit data", async () => {

                // send data into escrow 

                let events = {};
                const tx = await this.Instance.from(fulfiller).submitData(encryptedData);
                const receipt = await this.Instance.verboseWaitForTransaction(tx);

                // validate events

                [events.DataSubmitted] = utils.parseLogs(receipt, this.Instance, "DataSubmitted");

                assert.equal(events.DataSubmitted.data, encryptedData);

            });
        });

        describe("Requester finds no Fulfiller", () => {

            it("requester should successfully create escrow", async () => {

                // revert contract state

                await utils.revertState(this.deployer.provider, this.initSnapshot);

                // encode initialization variables into calldata

                const agreementTypes = ["uint120", "uint8", "uint128"];
                const agreementParams = [griefRatio, ratioType, agreementCountdown];
                const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

                let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
                let initParams = [requester, ethers.constants.AddressZero, ethers.constants.AddressZero, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
                const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

                // deploy escrow contract

                let events = {};
                const tx = await this.Factory.from(requester).create(calldata);
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

                assert.equal(events.Initialized.buyer, requester);
                assert.equal(events.Initialized.seller, ethers.constants.AddressZero);
                assert.equal(events.Initialized.operator, ethers.constants.AddressZero);
                assert.equal(events.Initialized.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(events.Initialized.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(events.Initialized.countdownLength, escrowCountdown);
                assert.equal(events.Initialized.metadata, "0x");
                assert.equal(events.Initialized.agreementParams, encodedParams);

                // validate state change

                assert.equal((await this.Instance.getBuyer()), requester);
                assert.equal((await this.Instance.isBuyer(requester)), true);
                assert.equal((await this.Instance.getSeller()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isSeller(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.getOperator()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isOperator(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.hasActiveOperator()), false);
                assert.equal((await this.Instance.isActiveOperator(ethers.constants.AddressZero)), false);
                assert.equal((await this.Instance.getLength()), escrowCountdown);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

                const data = await this.Instance.getData();
                assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(data.status, 0);
                assert.equal(data.ratio.toString(), griefRatio.toString());
                assert.equal(data.ratioType, 2);
                assert.equal(data.countdownLength, agreementCountdown);

            });

            it("requester should successfully deposit payment", async () => {

                // mint tokens 

                await this.MockNMR.mintMockTokens(requester, paymentAmount);

                // deposit NMR in the escrow

                const approveTx = await this.MockNMR.from(requester).approve(this.Instance.contractAddress, paymentAmount);
                const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
                const depositTx = await this.Instance.from(requester).depositPayment();
                const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.PaymentDeposited] = utils.parseLogs(depositReceipt, this.Instance, "PaymentDeposited");
                [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

                assert.equal(events.PaymentDeposited.buyer, requester);
                assert.equal(events.PaymentDeposited.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.staker, requester);
                assert.equal(events.StakeAdded.funder, requester);
                assert.equal(events.StakeAdded.amount.toString(), paymentAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), paymentAmount.toString());
                assert.equal(events.Transfer.from, requester);
                assert.equal(events.Transfer.to, this.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), paymentAmount.toString());

                // validate state change

                assert.equal((await this.Instance.getBuyer()), requester);
                assert.equal((await this.Instance.isBuyer(requester)), true);
                assert.equal((await this.Instance.getStake(requester)).toString(), paymentAmount.toString());
                assert.equal((await this.Instance.isStakeDeposited()), false);
                assert.equal((await this.Instance.isPaymentDeposited()), true);
                assert.equal((await this.Instance.isDeposited()), false);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

            });

            it("requester should successfully cancel escrow", async () => {

                // cancel escrow

                let events = {};
                const tx = await this.Instance.from(requester).cancel();
                const receipt = await this.Instance.verboseWaitForTransaction(tx);

                // validate events

                assert.equal(utils.hasEvent(receipt, this.Instance, "Cancelled"), true);
                [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");
                [events.StakeRemoved] = utils.parseLogs(depositReceipt, this.Instance, "StakeRemoved");
                [events.StakeTaken] = utils.parseLogs(depositReceipt, this.Instance, "StakeTaken");

                assert.equal(events.Transfer.from, this.Instance.contractAddress);
                assert.equal(events.Transfer.to, requester);
                assert.equal(events.Transfer.value.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved.staker, requester);
                assert.equal(events.StakeRemoved.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeRemoved.newStake.toNumber(), 0);
                assert.equal(events.StakeTaken.staker, requester);
                assert.equal(events.StakeTaken.recipient, requester);
                assert.equal(events.StakeTaken.amount.toString(), stakeAmount.toString());

                // validate state change

                assert.equal((await this.Instance.getStake(requester)).toNumber(), 0);
                assert.equal((await this.Instance.getEscrowStatus()), 3);
                assert.equal((await this.Instance.isStakeDeposited()), true);

            });
        });
    });

    describe("Seller", () => {
        describe("Seller Happy Path", () => {
            it("seller should successfully create escrow", async () => {

                // revert contract state

                await utils.revertState(this.deployer.provider, this.initSnapshot);

                // encode initialization variables into calldata

                const agreementTypes = ["uint120", "uint8", "uint128"];
                const agreementParams = [griefRatio, ratioType, agreementCountdown];
                const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

                let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
                let initParams = [ethers.constants.AddressZero, seller, ethers.constants.AddressZero, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
                const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

                // deploy escrow contract

                let events = {};
                const tx = await this.Factory.from(seller).create(calldata);
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

                assert.equal((await this.Instance.getBuyer()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isBuyer(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getOperator()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isOperator(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.hasActiveOperator()), false);
                assert.equal((await this.Instance.isActiveOperator(ethers.constants.AddressZero)), false);
                assert.equal((await this.Instance.getLength()), escrowCountdown);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

                const data = await this.Instance.getData();
                assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(data.status, 0);
                assert.equal(data.ratio.toString(), griefRatio.toString());
                assert.equal(data.ratioType, 2);
                assert.equal(data.countdownLength, agreementCountdown);

            });

            it("seller should successfully deposit stake", async () => {

                // mint tokens 

                await this.MockNMR.mintMockTokens(seller, stakeAmount);

                // deposit NMR in the escrow

                const approveTx = await this.MockNMR.from(seller).approve(this.Instance.contractAddress, stakeAmount);
                const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
                const depositTx = await this.Instance.from(seller).depositPayment();
                const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.StakeDeposited] = utils.parseLogs(depositReceipt, this.Instance, "StakeDeposited");
                [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

                assert.equal(events.StakeDeposited.seller, seller);
                assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.staker, seller);
                assert.equal(events.StakeAdded.funder, seller);
                assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
                assert.equal(events.Transfer.from, seller);
                assert.equal(events.Transfer.to, this.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), stakeAmount.toString());

                // validate state change

                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getStake(seller)).toString(), stakeAmount.toString());
                assert.equal((await this.Instance.isStakeDeposited()), true);
                assert.equal((await this.Instance.isPaymentDeposited()), false);
                assert.equal((await this.Instance.isDeposited()), false);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

            });

            it("buyer should successfully fulfill request and trigger countdown", async () => {

            });

            it("seller should successfully finalize", async () => {

            });

            it("seller should successfully submit the data", async () => {

            });
        });
        describe("Seller finds no Buyer", () => {
            it("seller should successfully create escrow", async () => {

                // revert contract state

                await utils.revertState(this.deployer.provider, this.initSnapshot);

                // encode initialization variables into calldata

                const agreementTypes = ["uint120", "uint8", "uint128"];
                const agreementParams = [griefRatio, ratioType, agreementCountdown];
                const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

                let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
                let initParams = [ethers.constants.AddressZero, seller, ethers.constants.AddressZero, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
                const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

                // deploy escrow contract

                let events = {};
                const tx = await this.Factory.from(seller).create(calldata);
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

                assert.equal((await this.Instance.getBuyer()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isBuyer(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getOperator()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isOperator(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.hasActiveOperator()), false);
                assert.equal((await this.Instance.isActiveOperator(ethers.constants.AddressZero)), false);
                assert.equal((await this.Instance.getLength()), escrowCountdown);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

                const data = await this.Instance.getData();
                assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(data.status, 0);
                assert.equal(data.ratio.toString(), griefRatio.toString());
                assert.equal(data.ratioType, 2);
                assert.equal(data.countdownLength, agreementCountdown);

            });

            it("seller should successfully deposit stake", async () => {

                // mint tokens 

                await this.MockNMR.mintMockTokens(seller, stakeAmount);

                // deposit NMR in the escrow

                const approveTx = await this.MockNMR.from(seller).approve(this.Instance.contractAddress, stakeAmount);
                const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
                const depositTx = await this.Instance.from(seller).depositPayment();
                const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.StakeDeposited] = utils.parseLogs(depositReceipt, this.Instance, "StakeDeposited");
                [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

                assert.equal(events.StakeDeposited.seller, seller);
                assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.staker, seller);
                assert.equal(events.StakeAdded.funder, seller);
                assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
                assert.equal(events.Transfer.from, seller);
                assert.equal(events.Transfer.to, this.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), stakeAmount.toString());

                // validate state change

                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getStake(seller)).toString(), stakeAmount.toString());
                assert.equal((await this.Instance.isStakeDeposited()), true);
                assert.equal((await this.Instance.isPaymentDeposited()), false);
                assert.equal((await this.Instance.isDeposited()), false);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

            });

            it("seller should successfully cancel", async () => {

            });
        });

        describe("Seller does not finalize sale", () => {
            it("seller should successfully create escrow", async () => {

                // revert contract state

                await utils.revertState(this.deployer.provider, this.initSnapshot);

                // encode initialization variables into calldata

                const agreementTypes = ["uint120", "uint8", "uint128"];
                const agreementParams = [griefRatio, ratioType, agreementCountdown];
                const encodedParams = AbiCoder.encode(agreementTypes, agreementParams);

                let initTypes = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'bytes', 'bytes'];
                let initParams = [ethers.constants.AddressZero, seller, ethers.constants.AddressZero, paymentAmount, stakeAmount, escrowCountdown, "0x", encodedParams];
                const calldata = abiEncodeWithSelector('initialize', initTypes, initParams);

                // deploy escrow contract

                let events = {};
                const tx = await this.Factory.from(seller).create(calldata);
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

                assert.equal((await this.Instance.getBuyer()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isBuyer(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getOperator()), ethers.constants.AddressZero);
                assert.equal((await this.Instance.isOperator(ethers.constants.AddressZero)), true);
                assert.equal((await this.Instance.hasActiveOperator()), false);
                assert.equal((await this.Instance.isActiveOperator(ethers.constants.AddressZero)), false);
                assert.equal((await this.Instance.getLength()), escrowCountdown);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

                const data = await this.Instance.getData();
                assert.equal(data.paymentAmount.toString(), paymentAmount.toString());
                assert.equal(data.stakeAmount.toString(), stakeAmount.toString());
                assert.equal(data.status, 0);
                assert.equal(data.ratio.toString(), griefRatio.toString());
                assert.equal(data.ratioType, 2);
                assert.equal(data.countdownLength, agreementCountdown);

            });

            it("seller should successfully deposit stake", async () => {

                // mint tokens 

                await this.MockNMR.mintMockTokens(seller, stakeAmount);

                // deposit NMR in the escrow

                const approveTx = await this.MockNMR.from(seller).approve(this.Instance.contractAddress, stakeAmount);
                const approveReceipt = await this.MockNMR.verboseWaitForTransaction(approveTx);
                const depositTx = await this.Instance.from(seller).depositPayment();
                const depositReceipt = await this.Instance.verboseWaitForTransaction(depositTx);

                let events = {};

                // validate events

                [events.StakeDeposited] = utils.parseLogs(depositReceipt, this.Instance, "StakeDeposited");
                [events.StakeAdded] = utils.parseLogs(depositReceipt, this.Instance, "StakeAdded");
                [events.Transfer] = utils.parseLogs(depositReceipt, this.MockNMR, "Transfer");

                assert.equal(events.StakeDeposited.seller, seller);
                assert.equal(events.StakeDeposited.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.staker, seller);
                assert.equal(events.StakeAdded.funder, seller);
                assert.equal(events.StakeAdded.amount.toString(), stakeAmount.toString());
                assert.equal(events.StakeAdded.newStake.toString(), stakeAmount.toString());
                assert.equal(events.Transfer.from, seller);
                assert.equal(events.Transfer.to, this.Instance.contractAddress);
                assert.equal(events.Transfer.value.toString(), stakeAmount.toString());

                // validate state change

                assert.equal((await this.Instance.getSeller()), seller);
                assert.equal((await this.Instance.isSeller(seller)), true);
                assert.equal((await this.Instance.getStake(seller)).toString(), stakeAmount.toString());
                assert.equal((await this.Instance.isStakeDeposited()), true);
                assert.equal((await this.Instance.isPaymentDeposited()), false);
                assert.equal((await this.Instance.isDeposited()), false);
                assert.equal((await this.Instance.getEscrowStatus()), 0);

            });

            it("buyer should successfully fulfill request and trigger countdown", async () => {

            });

            it("buyer should successfully cancel", async () => {

            });
        });
    });
});
