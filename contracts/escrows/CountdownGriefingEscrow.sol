pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../agreements/CountdownGriefing.sol";
import "../modules/iFactory.sol";
import "../modules/iRegistry.sol";
import "../modules/Countdown.sol";
import "../modules/Staking.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/// @title CountdownGriefingEscrow
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
/// @dev State Machine: https://www.lucidchart.com/publicSegments/view/839ccf53-cdc9-4528-8d5e-8ce53df6f647/image.png
contract CountdownGriefingEscrow is Countdown, Staking, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address buyer;
        address seller;
        address operator;
        uint128 paymentAmount;
        uint128 stakeAmount;
        EscrowStatus status;
        AgreementParams agreementParams;
    }

    struct AgreementParams {
        uint120 ratio;
        uint8 ratioType;
        uint128 countdownLength;
    }

    event Initialized(
        address buyer,
        address seller,
        address operator,
        uint256 paymentAmount,
        uint256 stakeAmount,
        uint256 countdownLength,
        bytes metadata,
        bytes agreementParams
    );
    event StakeDeposited(address seller, uint256 amount);
    event PaymentDeposited(address buyer, uint256 amount);
    event Finalized(address agreement);
    event DataSubmitted(bytes data);
    event Cancelled();

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param buyer Address of the user that will deposit payment
    /// @param seller Address of the user that will deposit stake and submit data
    /// @param operator Address of the user that overrides access control
    /// @param paymentAmount Amount of NMR (18 decimals) to be deposited by buyer as payment
    /// @param stakeAmount Amount of NMR (18 deciamals) to be deposited by seller as stake
    /// @param escrowCountdown Amount of time (in seconds) the seller has to finalize the escrow after the payment is deposited
    /// @param metadata Data (any format) to emit as event on initialization
    /// @param agreementParams Encoded CountdownGriefing Agreement initialization parameters (abi.encode(ratio, ratioType, agreementCountdown)) to create on escrow completion. See CountdownGriefing contract for details
    function initialize(
        address buyer,
        address seller,
        address operator,
        uint256 paymentAmount,
        uint256 stakeAmount,
        uint256 escrowCountdown,
        bytes memory metadata,
        bytes memory agreementParams
    ) public initializeTemplate() {
        // set participants if defined
        if (buyer != address(0)) {
            _data.buyer = buyer;
        }
        if (seller != address(0)) {
            _data.seller = seller;
        }

        // set operator if defined
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set amounts if defined
        if (paymentAmount != uint256(0)) {
            require(paymentAmount <= uint256(uint128(paymentAmount)), "paymentAmount is too large");
            _data.paymentAmount = uint128(paymentAmount);
        }
        if (stakeAmount != uint256(0)) {
            require(stakeAmount == uint256(uint128(stakeAmount)), "stakeAmount is too large");
            _data.stakeAmount = uint128(stakeAmount);
        }

        // set countdown length
        Countdown._setLength(escrowCountdown);

        // set metadata if defined
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // set agreementParams if defined
        if (agreementParams.length != 0) {
            (
                uint256 ratio,
                uint8 ratioType,
                uint256 agreementCountdown
            ) = abi.decode(agreementParams, (uint256, uint8, uint256));
            require(ratio == uint256(uint120(ratio)), "ratio out of bounds");
            require(agreementCountdown == uint256(uint128(agreementCountdown)), "agreementCountdown out of bounds");
            _data.agreementParams = AgreementParams(uint120(ratio), uint8(ratioType), uint128(agreementCountdown));
        }

        // emit event
        emit Initialized(buyer, seller, operator, paymentAmount, stakeAmount, escrowCountdown, metadata, agreementParams);
    }

    /// @notice Emit metadata event
    /// @dev Access Control: operator
    ///      State Machine: always
    /// @param metadata Data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only  active operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Deposit Stake in NMR
    ///          - requires the seller to have previously approved the escrow to transfer the amount of tokens
    ///          - if seller not already set, make msg.sender the seller
    ///          - if buyer already deposited the payment, finalize the escrow
    /// @dev Access Control: buyer OR operator
    ///      State Machine: before finalize() OR before cancel()
    function depositStake() public {
        // restrict access control
        // set msg.sender as seller if not already set
        if (!isSeller(msg.sender) && !Operated.isActiveOperator(msg.sender)) {
            require(_data.seller == address(0), "only seller or active operator");
            _data.seller = msg.sender;
        }
        // restrict state machine
        require(isOpen() || onlyPaymentDeposited(), "can only deposit stake once");

        // declare storage variables in memory
        address seller = _data.seller;
        uint256 stakeAmount = uint256(_data.stakeAmount);

        // Add the stake amount
        if (stakeAmount != uint256(0)) {
            Staking._addStake(seller, msg.sender, stakeAmount);
        }

        // emit event
        emit StakeDeposited(seller, stakeAmount);

        // If payment is deposited, finalize the escrow
        if (onlyPaymentDeposited()) {
            _data.status = EscrowStatus.isDeposited;
            finalize();
        } else {
            _data.status = EscrowStatus.onlyStakeDeposited;
        }

    }

    /// @notice Deposit Payment in NMR
    ///          - requires the buyer to have previously approved the escrow to transfer the amount of tokens
    ///          - if buyer not already set, make msg.sender the buyer
    ///          - if seller already deposited the stake, start the finalization countdown
    /// @dev Access Control: buyer OR operator
    ///      State Machine: before finalize() OR before cancel()
    function depositPayment() public {
        // restrict access control
        // set msg.sender as buyer if not already set
        if (!isBuyer(msg.sender) && !Operated.isActiveOperator(msg.sender)) {
            require(_data.buyer == address(0), "only buyer or active operator");
            _data.buyer = msg.sender;
        }
        // restrict state machine
        require(isOpen() || onlyStakeDeposited(), "can only deposit payment once");

        // declare storage variables in memory
        address buyer = _data.buyer;
        uint256 paymentAmount = uint256(_data.paymentAmount);

        // Add the payment as a stake
        if (paymentAmount != uint256(0)) {
            Staking._addStake(buyer, msg.sender, paymentAmount);
        }

        // emit event
        emit PaymentDeposited(buyer, paymentAmount);

        // If stake is deposited, start countdown for seller to finalize
        if (onlyStakeDeposited()) {
            _data.status = EscrowStatus.isDeposited;
            Countdown._start();
        } else {
            _data.status = EscrowStatus.onlyPaymentDeposited;
        }
    }

    /// @notice Finalize escrow and execute completion script
    ///          - create the agreement
    ///          - transfer deposited stake and payment to agreement
    ///          - start agreement countdown
    ///          - disable agreement operator
    /// @dev Access Control: seller OR operator
    ///      State Machine: after depositStake() AND after depositPayment()
    function finalize() public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(isDeposited(), "only after deposit");

        // create the agreement

        address agreement;
        {
            // get the agreement factory address

            address escrowFactory = Template.getFactory();
            address escrowRegistry = iFactory(escrowFactory).getInstanceRegistry();
            address agreementFactory = abi.decode(iRegistry(escrowRegistry).getFactoryData(escrowFactory), (address));

            // encode initialization function
            bytes memory initCalldata = abi.encodeWithSignature(
                'initialize(address,address,address,uint256,uint8,uint256,bytes)',
                address(this),
                _data.seller,
                _data.buyer,
                uint256(_data.agreementParams.ratio),
                _data.agreementParams.ratioType,
                uint256(_data.agreementParams.countdownLength),
                bytes("")
            );

            // deploy and initialize agreement contract
            agreement = iFactory(agreementFactory).create(initCalldata);
        }

        // transfer stake and payment to the agreement

        uint256 totalStake;
        {
            uint256 paymentAmount = Deposit._clearDeposit(_data.buyer);
            uint256 stakeAmount = Deposit._clearDeposit(_data.seller);
            totalStake = paymentAmount.add(stakeAmount);
        }

        if (totalStake > 0) {
            require(IERC20(BurnNMR.getToken()).approve(agreement, totalStake), "token approval failed");
            CountdownGriefing(agreement).increaseStake(totalStake);
        }

        // start agreement countdown

        CountdownGriefing(agreement).startCountdown();

        // transfer operator
        address operator = Operated.getOperator();
        if (operator != address(0)) {
            CountdownGriefing(agreement).transferOperator(operator);
        } else {
            CountdownGriefing(agreement).renounceOperator();
        }

        // update status
        _data.status = EscrowStatus.isFinalized;

        // delete storage
        delete _data.paymentAmount;
        delete _data.stakeAmount;
        delete _data.agreementParams;

        // emit event
        emit Finalized(agreement);
    }

    /// @notice Submit data to the buyer
    /// @dev Access Control: seller OR operator
    ///      State Machine: after finalize()
    /// @param data Data (any format) to submit to the buyer
    function submitData(bytes memory data) public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(isFinalized(), "only after finalized");

        // emit event
        emit DataSubmitted(data);
    }

    /// @notice Cancel escrow because no interested counterparty
    ///          - return deposit to caller
    ///          - close escrow
    /// @dev Access Control: seller OR buyer OR operator
    ///      State Machine: before depositStake() OR before depositPayment()
    function cancel() public {
        // restrict access control
        require(isSeller(msg.sender) || isBuyer(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or buyer or active operator");
        // restrict state machine
        require(isOpen() || onlyStakeDeposited() || onlyPaymentDeposited(), "only before deposits are completed");

        // cancel escrow and return deposits
        _cancel();
    }

    /// @notice Cancel escrow if seller does not finalize
    ///          - return stake to seller
    ///          - return payment to buyer
    ///          - close escrow
    /// @dev Access Control: buyer OR operator
    ///      State Machine: after depositStake() AND after depositPayment() AND after Countdown.isOver()
    function timeout() public {
        // restrict access control
        require(isBuyer(msg.sender) || Operated.isActiveOperator(msg.sender), "only buyer or active operator");
        // restrict state machine
        require(isDeposited() && Countdown.isOver(), "only after countdown ended");

        // cancel escrow and return deposits
        _cancel();
    }

    function _cancel() private {
        // declare storage variables in memory
        address seller = _data.seller;
        address buyer = _data.buyer;

        // return stake to seller
        if (Staking.getStake(seller) != 0) {
            Staking._takeFullStake(seller, seller);
        }

        // return payment to buyer
        if (Staking.getStake(buyer) != 0) {
            Staking._takeFullStake(buyer, buyer);
        }

        // update status
        _data.status = EscrowStatus.isCancelled;

        // delete storage
        delete _data.paymentAmount;
        delete _data.stakeAmount;
        delete _data.agreementParams;

        // emit event
        emit Cancelled();
    }

    /// View functions

    function getBuyer() public view returns (address buyer) {
        return _data.buyer;
    }

    function isBuyer(address caller) public view returns (bool validity) {
        return caller == getBuyer();
    }

    function getSeller() public view returns (address seller) {
        return _data.seller;
    }

    function isSeller(address caller) public view returns (bool validity) {
        return caller == getSeller();
    }

    function getData() public view returns (
        uint128 paymentAmount,
        uint128 stakeAmount,
        EscrowStatus status,
        uint120 ratio,
        uint8 ratioType,
        uint128 countdownLength
    ) {
        return (
            _data.paymentAmount,
            _data.stakeAmount,
            _data.status,
            _data.agreementParams.ratio,
            _data.agreementParams.ratioType,
            _data.agreementParams.countdownLength
        );
    }

    enum EscrowStatus { isOpen, onlyStakeDeposited, onlyPaymentDeposited, isDeposited, isFinalized, isCancelled }
    /// @notice Return the status of the state machine
    ///          - isOpen: initialized but no deposits made
    ///          - onlyStakeDeposited: only stake deposit completed
    ///          - onlyPaymentDeposited: only payment deposit completed
    ///          - isDeposited: both payment and stake deposit is completed
    ///          - isFinalized: the escrow completed successfully
    ///          - isCancelled: the escrow was cancelled
    function getEscrowStatus() public view returns (EscrowStatus status) {
        return _data.status;
    }

    function isOpen() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isOpen;
    }

    function onlyStakeDeposited() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.onlyStakeDeposited;
    }

    function onlyPaymentDeposited() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.onlyPaymentDeposited;
    }

    function isDeposited() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isDeposited;
    }

    function isFinalized() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isFinalized;
    }

    function isCancelled() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isCancelled;
    }

}
