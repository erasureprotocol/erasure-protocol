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
/// @dev Security contract: security@numer.ai
contract CountdownGriefingEscrow is Countdown, Staking, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address buyer;
        address seller;
        address operator;
        uint256 paymentAmount;
        uint256 stakeAmount;
        EscrowStatus status;
        bytes agreementParams;
    }

    event Initialized(
        address buyer,
        address seller,
        uint256 paymentAmount,
        uint256 stakeAmount,
        uint256 countdownLength,
        bytes metadata,
        bytes agreementParams
    );
    event DataSubmitted(bytes data);
    event StakeDeposited(address seller, uint256 stake);
    event PaymentDeposited(address buyer, uint256 payment);
    event Finalized();
    event Cancelled();

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    function initialize(
        address buyer,
        address seller,
        address operator,
        uint256 paymentAmount,
        uint256 stakeAmount,
        uint256 countdownLength,
        bytes memory metadata,
        bytes memory agreementParams
    ) public initializeTemplate() {
        // set participants if defined
        if (buyer != address(0))
            _data.buyer = buyer;
        if (seller != address(0))
            _data.seller = seller;

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set amounts if defined
        if (paymentAmount != uint256(0))
            _data.paymentAmount = paymentAmount;
        if (stakeAmount != uint256(0))
            _data.stakeAmount = stakeAmount;

        // set countdown length
        Countdown._setLength(countdownLength);

        // set metadata
        if (metadata.length != 0)
            EventMetadata._setMetadata(metadata);

        // set agreementParams
        if (agreementParams.length != 0)
            _data.agreementParams = agreementParams;

        // emit event
        emit Initialized(buyer, seller, paymentAmount, stakeAmount, countdownLength, metadata, agreementParams);
    }

    /// @notice Emit metadata event
    /// @dev Access Control: seller OR buyer OR operator
    ///      State Machine: always
    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(isSeller(msg.sender) || isBuyer(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or buyer or active operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Deposit Stake
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
        require(!isFinalized() && !isCancelled(), "only before finalize or cancel");

        // Add the stake amount
        if (_data.stakeAmount != uint256(0))
            Staking._addStake(_data.seller, msg.sender, uint256(0), _data.stakeAmount);

        // If payment is deposited, finalize the escrow
        if (isPaymentDeposited())
            _data.status = EscrowStatus.isDeposited;
            finalize();

        // emit event
        emit StakeDeposited(_data.seller, _data.stakeAmount);
    }

    /// @notice Deposit Payment
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
        require(!isFinalized() && !isCancelled(), "only before finalize or cancel");

        // Add the payment as a stake
        if (_data.paymentAmount != uint256(0))
            Staking._addStake(_data.buyer, msg.sender, uint256(0), _data.paymentAmount);

        // If stake is deposited, start countdown for seller to finalize
        if (isStakeDeposited())
            _data.status = EscrowStatus.isDeposited;
            Countdown._start();

        // emit event
        emit PaymentDeposited(_data.buyer, _data.paymentAmount);
    }

    /// @notice Finalize escrow and execute completion script
    ///          - create the agreement
    ///          - transfer stake and payment to agreement
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
            // decode agreement initialization parameters
            (
                uint256 ratio,
                uint8 ratioType,
                uint256 countdownLength
            ) = abi.decode(_data.agreementParams, (uint256, uint8, uint256));
            // encode initialization function
            bytes memory initCalldata = abi.encodeWithSignature(
                'initialize',
                address(this),
                _data.seller,
                _data.buyer,
                ratio,
                ratioType,
                countdownLength,
                bytes("0x")
            );
            // deploy and initialize agreement contract
            agreement = iFactory(agreementFactory).create(initCalldata);
        }

        // transfer stake and payment to the agreement

        uint256 totalStake;
        {
            if (_data.paymentAmount != uint256(0))
                Staking._removeFullStake(_data.buyer);
            if (_data.stakeAmount != uint256(0))
                Staking._removeFullStake(_data.seller);
            totalStake = _data.paymentAmount.add(_data.stakeAmount);
        }

        CountdownGriefing(agreement).increaseStake(0, totalStake);

        // start agreement countdown

        CountdownGriefing(agreement).startCountdown();

        // disable operator

        CountdownGriefing(agreement).renounceOperator();

        // update status
        _data.status = EscrowStatus.isFinalized;

        // emit event
        emit Finalized();
    }

    /// @notice Submit data to the buyer
    /// @dev Access Control: seller OR operator
    ///      State Machine: after finalize()
    function submitData(bytes memory data) public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(isDeposited(), "only after deposit");

        // emit event
        emit DataSubmitted(data);
    }

    /// @notice Finalize escrow and execute completion script
    ///          - return stake to seller
    ///          - return payment to buyer
    ///          - close escrow
    /// @dev Access Control: seller OR buyer OR operator
    ///      State Machine: before depositStake() OR before depositPayment() OR after Countdown.isOver()
    function cancel() public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(!isDeposited() || Countdown.isOver(), "only after deposit and countdown");

        // return stake to seller
        if (_data.stakeAmount != uint256(0))
            Staking._takeFullStake(_data.seller, _data.seller);

        // return payment to buyer
        if (_data.paymentAmount != uint256(0))
            Staking._takeFullStake(_data.buyer, _data.buyer);

        // update status
        _data.status = EscrowStatus.isCancelled;

        // emit event
        emit Cancelled();
    }

    /// View functions

    /// @notice Return true iff caller is seller
    function isSeller(address caller) public view returns (bool validity) {
        return caller == _data.seller;
    }

    /// @notice Return true iff caller is buyer
    function isBuyer(address caller) public view returns (bool validity) {
        return caller == _data.buyer;
    }

    /// @notice Return true iff depositStake() has been called successfully
    function isStakeDeposited() public view returns (bool validity) {
        return Staking.getStake(_data.seller) == _data.stakeAmount;
    }

    /// @notice Return true iff depositPayment() has been called successfully
    function isPaymentDeposited() public view returns (bool validity) {
        return Staking.getStake(_data.buyer) == _data.paymentAmount;
    }

    enum EscrowStatus { isOpen, isDeposited, isFinalized, isCancelled }
    /// @notice Return the status of the state machine
    ///          - isOpen: deposits are not completed
    ///          - isDeposited: both payment and stake deposit is completed
    ///          - isFinalized: the escrow completed successfully
    ///          - isCancelled: the escrow was cancelled
    function getEscrowStatus() public view returns (EscrowStatus status) {
        return _data.status;
    }

    function isOpen() public view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isOpen;
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
