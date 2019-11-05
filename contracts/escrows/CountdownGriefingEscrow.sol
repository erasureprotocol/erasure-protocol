pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../agreements/CountdownGriefing.sol";
import "../modules/iFactory.sol";
import "../modules/Countdown.sol";
import "../modules/Staking.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";


contract CountdownGriefingEscrow is Countdown, Staking, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address buyer;
        address seller;
        address operator;
        address agreementFactory;
        address agreement;
        uint256 paymentAmount;
        uint256 stakeAmount;
        uint256 countdownLength;
        bool cancelled;
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

    /// Constructor
    /// Access control: factory
    /// State Machine: before all
    function initialize(
        address buyer,
        address seller,
        address operator,
        address agreementFactory,
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

        // set agreement factory
        _data.agreementFactory = agreementFactory;

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

    /// Deposit Stake
    /// - if seller not already set, make msg.sender the seller
    /// - if buyer already deposited the payment, finalize the escrow
    /// Access control: buyer OR operator
    /// State Machine: before finalize() OR before cancel()
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
            finalize();
    }

    /// Deposit Payment
    /// - if buyer not already set, make msg.sender the buyer
    /// - if seller already deposited the stake, start the finalization countdown
    /// Access control: buyer OR operator
    /// State Machine: before finalize() OR before cancel()
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
            Countdown._start();
    }

    /// Finalize escrow and execute completion script
    /// - create the agreement
    /// - transfer stake and payment to agreement
    /// - start agreement countdown
    /// - disable agreement operator
    /// Access control: seller or operator
    /// State Machine: after depositStake() AND after depositPayment()
    function finalize() public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(isDeposited(), "only after deposit");

        // create the agreement

        (
            uint256 ratio,
            uint8 ratioType,
            uint256 countdownLength,
            bytes memory metadata
        ) = abi.decode(_data.agreementParams, (uint256, uint8, uint256, bytes));

        bytes memory initCalldata = abi.encodeWithSignature(
            'initialize',
            address(this),
            _data.seller,
            _data.buyer,
            ratio,
            ratioType,
            countdownLength,
            metadata
        );
        
        _data.agreement = iFactory(_data.agreementFactory).create(initCalldata);

        // transfer stake and payment to the agreement

        if (_data.paymentAmount != uint256(0))
            Staking._removeFullStake(_data.buyer);
        if (_data.stakeAmount != uint256(0))
            Staking._removeFullStake(_data.seller);
        uint256 totalStake = _data.paymentAmount.add(_data.stakeAmount);

        CountdownGriefing(_data.agreement).increaseStake(0, totalStake);

        // start agreement countdown

        CountdownGriefing(_data.agreement).startCountdown();

        // disable operator

        CountdownGriefing(_data.agreement).renounceOperator();
    }

    /// Submit data to the buyer
    /// Access control: seller or operator
    /// State Machine: after finalize()
    function submitData(bytes memory data) public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isActiveOperator(msg.sender), "only seller or active operator");
        // restrict state machine
        require(isDeposited(), "only after deposit");

        // emit event
        emit DataSubmitted(data);
    }

    /// Finalize escrow and execute completion script
    /// - return stake to seller
    /// - return payment to buyer
    /// - close escrow
    /// Access control: seller OR buyer OR operator
    /// State Machine: before depositStake() OR before depositPayment() OR after Countdown.isOver()
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

        // close escrow
        _data.cancelled = true;
    }

    /// View functions

    /// Return true iff caller is seller
    function isSeller(address caller) public view returns (bool validity) {
        return caller == _data.seller;
    }

    /// Return true iff caller is buyer
    function isBuyer(address caller) public view returns (bool validity) {
        return caller == _data.buyer;
    }

    /// Return true iff depositStake() has been called successfully
    function isStakeDeposited() public view returns (bool validity) {
        return Staking.getStake(_data.seller) == _data.stakeAmount;
    }

    /// Return true iff depositPayment() has been called successfully
    function isPaymentDeposited() public view returns (bool validity) {
        return Staking.getStake(_data.buyer) == _data.paymentAmount;
    }

    enum EscrowStatus { isOpen, isDeposited, isFinalized, isCancelled }
    /// Return the status of the state machine
    /// - isOpen: deposits are not completed
    /// - isDeposited: both payment and stake deposit is completed
    /// - isFinalized: the escrow completed successfully
    /// - isCancelled: the escrow was cancelled
    function getEscrowStatus() public view returns (EscrowStatus status) {
        if (_data.cancelled)
            return EscrowStatus.isCancelled;
        if (_data.agreement != address(0))
            return EscrowStatus.isFinalized;
        if (isStakeDeposited() && isPaymentDeposited())
            return EscrowStatus.isDeposited;
        else
            return EscrowStatus.isOpen;
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
