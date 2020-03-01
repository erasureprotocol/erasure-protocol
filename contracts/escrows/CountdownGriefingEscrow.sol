pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/escrows/CountdownGriefingEscrow.png
/// @notice This escrow allows for a buyer and a seller to deposit their stake and payment before sending it to a CountdownGriefing agreement.
///         A new instance is initialized by the factory using the `initData` received. See the `initialize()` function for details.
///         Notable features:
///             - The deposited payment and stake become the stake of the agreement once the escrow is finalized.
///             - If the buyer is not defined on creation, the first user to deposit the payment becomes the buyer.
///             - If the seller is not defined on creation, the first user to deposit the stake becomes the seller.
///             - Either party is able to cancel the escrow and retrieve their deposit if their counterparty never completes their deposit.
///             - If the buyer deposits their payment after the stake has already been deposited by the seller, this starts a countdown for the seller to finalize the escrow.
///             - If the seller does not finalize the escrow before the end of the countdown, the buyer can timeout the escrow and recover their stake.
///             - An operator can optionally be defined to grant full permissions to a trusted external address or contract. This operator will be inherited by the spawned agreement.
///         **Note**
///             Given the nature of ethereum, it is possible that while a cancel request is pending, the counterparty finalizes the escrow and the deposits are transfered to the agreement.
///             This contract is designed such that there is only two end states: deposits are returned to the buyer and the seller OR the agreement is successfully created.
///             This is why a user CANNOT rely on the cancellation feature to always work.
contract CountdownGriefingEscrow is Countdown, Staking, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address buyer;
        address seller;
        TokenManager.Tokens tokenID;
        uint128 paymentAmount;
        uint128 stakeAmount;
        EscrowStatus status;
        AgreementParams agreementParams;
    }

    struct AgreementParams {
        uint120 ratio;
        Griefing.RatioType ratioType;
        uint128 countdownLength;
    }

    event Initialized(
        address operator,
        address buyer,
        address seller,
        TokenManager.Tokens tokenID,
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

    /// @notice Constructor used to initialize the escrow parameters.
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator address of the operator that overrides access control. Optional parameter. Passing the address(0) will disable operator functionality.
    /// @param buyer address of the buyer. Optional parameter. This address is the only one able to deposit the payment. If not set, the first to deposit the payment becomes the buyer.
    /// @param seller address of the seller. Optional parameter. This address is the only one able to deposit the stake. If not set, the first to deposit the stake becomes the seller.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. Required parameter. This ID must be one of the IDs supported by TokenManager.
    /// @param paymentAmount uint256 amount of tokens (18 decimals) to be deposited by buyer as payment. Required parameter. This number must fit in a uint128 for optimization reasons.
    /// @param stakeAmount uint256 amount of tokens (18 decimals) to be deposited by seller as stake. Required parameter. This number must fit in a uint128 for optimization reasons.
    /// @param escrowCountdown uint256 amount of time (in seconds) the seller has to finalize the escrow after the payment and stake is deposited. Required parameter.
    /// @param metadata bytes data (any format) to emit as event on initialization. Optional parameter.
    /// @param agreementParams bytes ABI-encoded parameters used by CountdownGriefing agreement on initialization. Required parameter.
    ///                        This encoded data blob must contain the uint120 ratio, Griefing.RatioType ratioType, and uint128 agreementCountdown encoded as `abi.encode(ratio, ratioType, agreementCountdown)`.
    ///                        See CountdownGriefing initialize function for additional details.
    function initialize(
        address operator,
        address buyer,
        address seller,
        TokenManager.Tokens tokenID,
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
        }

        // set token
        require(TokenManager.isValidTokenID(tokenID), 'invalid token');
        _data.tokenID = tokenID;

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
                Griefing.RatioType ratioType,
                uint256 agreementCountdown
            ) = abi.decode(agreementParams, (uint256, Griefing.RatioType, uint256));
            require(ratio == uint256(uint120(ratio)), "ratio out of bounds");
            require(agreementCountdown == uint256(uint128(agreementCountdown)), "agreementCountdown out of bounds");
            _data.agreementParams = AgreementParams(uint120(ratio), ratioType, uint128(agreementCountdown));
        }

        // emit event
        emit Initialized(operator, buyer, seller, tokenID, paymentAmount, stakeAmount, escrowCountdown, metadata, agreementParams);
    }

    /// @notice Emit metadata event.
    /// @dev Access Control: operator
    ///      State Machine: always
    /// @param metadata Data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Deposit Stake and set seller address.
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount.
    ///          - if buyer already deposited the payment, finalize the escrow.
    /// @dev Access Control: anyone
    ///      State Machine: before finalize() OR before cancel()
    /// @param seller address of the seller
    function depositAndSetSeller(address seller) public {
        // restrict state machine
        require(_data.seller == address(0), "seller already set");

        // set seller
        _data.seller = seller;

        // deposit stake
        _depositStake();
    }

    /// @notice Deposit Stake.
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount.
    ///          - if buyer already deposited the payment, finalize the escrow.
    /// @dev Access Control: buyer OR operator
    ///      State Machine: before finalize() OR before cancel()
    function depositStake() public {
        // restrict access control
        require(isSeller(msg.sender) || Operated.isOperator(msg.sender), "only seller or operator");

        // restrict state machine
        require(_data.seller != address(0), "seller not yet set");

        // deposit stake
        _depositStake();
    }

    function _depositStake() private {
        // restrict state machine
        require(isOpen() || onlyPaymentDeposited(), "can only deposit stake once");

        // declare storage variables in memory
        address seller = _data.seller;
        uint256 stakeAmount = uint256(_data.stakeAmount);

        // Add the stake amount
        if (stakeAmount != uint256(0)) {
            Staking._addStake(_data.tokenID, seller, msg.sender, stakeAmount);
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

    /// @notice Deposit Payment and set buyer address.
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount.
    ///          - if seller already deposited the stake, start the finalization countdown.
    /// @dev Access Control: anyone
    ///      State Machine: before finalize() OR before cancel()
    /// @param buyer address of the buyer
    function depositAndSetBuyer(address buyer) public {
        // restrict state machine
        require(_data.buyer == address(0), "buyer already set");

        // set buyer
        _data.buyer = buyer;

        // deposit payment
        _depositPayment();
    }

    /// @notice Deposit Payment.
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount.
    ///          - if seller already deposited the stake, start the finalization countdown.
    /// @dev Access Control: buyer OR operator
    ///      State Machine: before finalize() OR before cancel()
    function depositPayment() public {
        // restrict access control
        require(isBuyer(msg.sender) || Operated.isOperator(msg.sender), "only buyer or operator");

        // restrict state machine
        require(_data.buyer != address(0), "buyer not yet set");

        // deposit payment
        _depositPayment();
    }

    function _depositPayment() private {
        // restrict state machine
        require(isOpen() || onlyStakeDeposited(), "can only deposit payment once");

        // declare storage variables in memory
        address buyer = _data.buyer;
        uint256 paymentAmount = uint256(_data.paymentAmount);

        // Add the payment as a stake
        if (paymentAmount != uint256(0)) {
            Staking._addStake(_data.tokenID, buyer, msg.sender, paymentAmount);
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
        require(isSeller(msg.sender) || Operated.isOperator(msg.sender), "only seller or operator");
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
            bytes memory initCalldata = abi.encodeWithSelector(
                iFactory(agreementFactory).getInitSelector(),
                address(this), // operator
                _data.seller,  // staker
                _data.buyer,   // counterparty
                _data.tokenID, // tokenID
                uint256(_data.agreementParams.ratio),           // griefRatio
                _data.agreementParams.ratioType,                // ratioType
                uint256(_data.agreementParams.countdownLength), // countdownLength
                bytes("")      // metadata
            );

            // deploy and initialize agreement contract
            agreement = iFactory(agreementFactory).create(initCalldata);
        }

        // transfer stake and payment to the agreement

        uint256 totalStake;
        {
            uint256 paymentAmount = Deposit._clearDeposit(_data.tokenID, _data.buyer);
            uint256 stakeAmount = Deposit._clearDeposit(_data.tokenID, _data.seller);
            totalStake = paymentAmount.add(stakeAmount);
        }

        if (totalStake > 0) {
            TokenManager._approve(_data.tokenID, agreement, totalStake);
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
        delete _data.tokenID;
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
        require(isSeller(msg.sender) || Operated.isOperator(msg.sender), "only seller or operator");
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
        require(isSeller(msg.sender) || isBuyer(msg.sender) || Operated.isOperator(msg.sender), "only seller or buyer or operator");
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
        require(isBuyer(msg.sender) || Operated.isOperator(msg.sender), "only buyer or operator");
        // restrict state machine
        require(isDeposited() && Countdown.isOver(), "only after countdown ended");

        // cancel escrow and return deposits
        _cancel();
    }

    function _cancel() private {
        // declare storage variables in memory
        address seller = _data.seller;
        address buyer = _data.buyer;
        TokenManager.Tokens tokenID = _data.tokenID;

        // return stake to seller
        if (Deposit.getDeposit(tokenID, seller) != 0) {
            Staking._takeFullStake(tokenID, seller, seller);
        }

        // return payment to buyer
        if (Deposit.getDeposit(tokenID, buyer) != 0) {
            Staking._takeFullStake(tokenID, buyer, buyer);
        }

        // update status
        _data.status = EscrowStatus.isCancelled;

        // delete storage
        delete _data.tokenID;
        delete _data.paymentAmount;
        delete _data.stakeAmount;
        delete _data.agreementParams;

        // emit event
        emit Cancelled();
    }

    /// @notice Called by the operator to transfer control to new operator
    /// @dev Access Control: operator
    ///      State Machine: anytime
    /// @param operator Address of the new operator
    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    /// @notice Called by the operator to renounce control
    /// @dev Access Control: operator
    ///      State Machine: anytime
    function renounceOperator() public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // renounce operator
        Operated._renounceOperator();
    }

    /// View functions

    /// @notice Get the address of the buyer (if set)
    /// @return buyer address of the buyer
    function getBuyer() public view returns (address buyer) {
        return _data.buyer;
    }

    /// @notice Validate if the address matches the stored buyer address
    /// @param caller address to validate
    /// @return validity bool true if matching address
    function isBuyer(address caller) internal view returns (bool validity) {
        return caller == getBuyer();
    }

    /// @notice Get the address of the seller (if set)
    /// @return buyer address of the buyer
    function getSeller() public view returns (address seller) {
        return _data.seller;
    }

    /// @notice Validate if the address matches the stored seller address
    /// @param caller address to validate
    /// @return validity bool true if matching address
    function isSeller(address caller) internal view returns (bool validity) {
        return caller == getSeller();
    }

    /// @notice Return the amount of tokens deposited by the user
    /// @param user address of the user to query the deposit
    /// @return amount uint256 amount of tokens deposited
    function getDeposit(address user) public view returns (uint256 amount) {
        return Deposit.getDeposit(_data.tokenID, user);
    }

    /// @notice Get the data from storage.
    /// @return tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return uint128 paymentAmount set in initialization.
    /// @return uint128 stakeAmount set in initialization.
    /// @return uint120 ratio used for initialization of agreement on completion.
    /// @return Griefing.RatioType ratioType used for initialization of agreement on completion.
    /// @return uint128 countdownLength used for initialization of agreement on completion.
    function getData() public view returns (
        TokenManager.Tokens tokenID,
        uint128 paymentAmount,
        uint128 stakeAmount,
        uint120 ratio,
        Griefing.RatioType ratioType,
        uint128 countdownLength
    ) {
        return (
            _data.tokenID,
            _data.paymentAmount,
            _data.stakeAmount,
            _data.agreementParams.ratio,
            _data.agreementParams.ratioType,
            _data.agreementParams.countdownLength
        );
    }

    enum EscrowStatus { isOpen, onlyStakeDeposited, onlyPaymentDeposited, isDeposited, isFinalized, isCancelled }
    /// @notice Return the status of the state machine
    /// @return EscrowStatus status from of the following states:
    ///          - isOpen: initialized but no deposits made
    ///          - onlyStakeDeposited: only stake deposit completed
    ///          - onlyPaymentDeposited: only payment deposit completed
    ///          - isDeposited: both payment and stake deposit is completed
    ///          - isFinalized: the escrow completed successfully
    ///          - isCancelled: the escrow was cancelled
    function getEscrowStatus() public view returns (EscrowStatus status) {
        return _data.status;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.isOpen state
    /// @return validity bool true if correct state
    function isOpen() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isOpen;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.onlyStakeDeposited state
    /// @return validity bool true if correct state
    function onlyStakeDeposited() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.onlyStakeDeposited;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.onlyPaymentDeposited state
    /// @return validity bool true if correct state
    function onlyPaymentDeposited() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.onlyPaymentDeposited;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.isDeposited state
    /// @return validity bool true if correct state
    function isDeposited() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isDeposited;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.isFinalized state
    /// @return validity bool true if correct state
    function isFinalized() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isFinalized;
    }

    /// @notice Validate if the state machine is in the EscrowStatus.isCancelled state
    /// @return validity bool true if correct state
    function isCancelled() internal view returns (bool validity) {
        return getEscrowStatus() == EscrowStatus.isCancelled;
    }
}
