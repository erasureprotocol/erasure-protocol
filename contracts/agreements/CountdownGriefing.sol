pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../modules/Countdown.sol";
import "../modules/Griefing.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/// @title CountdownGriefing
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/agreements/CountdownGriefing.png
/// @notice This agreement template allows a staker to grant permission to a counterparty to punish, reward, or release their stake until the countdown is completed.
///         A new instance is initialized by the factory using the `initData` received. See the `initialize()` function for details on initialization parameters.
///         Notable features:
///             - The staker can increase the stake at any time before the end of the countdown.
///             - The counterparty can increase, release, or punish the stake at any time before the end of the countdown.
///             - The agreement can be terminated by the staker by starting the countdown. Once the countdown completes the staker can retrieve their remaining stake.
///             - Punishments use griefing which requires the counterparty to pay an appropriate amount based on the desired punishment and a predetermined ratio.
///             - An operator can optionally be defined to grant full permissions to a trusted external address or contract.
contract CountdownGriefing is Countdown, Griefing, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address staker;
        address counterparty;
    }

    event Initialized(
        address operator,
        address staker,
        address counterparty,
        TokenManager.Tokens tokenID,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes metadata
    );

    /// @notice Constructor used to initialize the agreement parameters.
    ///         All parameters are passed as ABI-encoded calldata to the factory. This calldata must include the function selector.
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator address of the operator that overrides access control. Optional parameter. Passing the address(0) will disable operator functionality.
    /// @param staker address of the staker who owns the stake. Required parameter. This address is the only one able to retrieve the stake and cannot be changed.
    /// @param counterparty address of the counterparty who has the right to reward, release, and punish the stake. Required parameter. This address cannot be changed.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. Required parameter. This ID must be one of the IDs supported by TokenManager.
    /// @param ratio uint256 number (18 decimals) used to determine punishment cost. Required parameter. See Griefing module for details on valid input.
    /// @param ratioType Griefing.RatioType number used to determine punishment cost. Required parameter. See Griefing module for details on valid input.
    /// @param countdownLength uint256 amount of time (in seconds) the counterparty has to punish or reward before the agreement ends. Required parameter.
    /// @param metadata bytes data (any format) to emit as event on initialization. Optional parameter.
    function initialize(
        address operator,
        address staker,
        address counterparty,
        TokenManager.Tokens tokenID,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory metadata
    ) public initializeTemplate() {
        // set storage values
        _data.staker = staker;
        _data.counterparty = counterparty;

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
        }

        // set griefing ratio
        Griefing._setRatio(staker, tokenID, ratio, ratioType);

        // set countdown length
        Countdown._setLength(countdownLength);

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, staker, counterparty, tokenID, ratio, ratioType, countdownLength, metadata);
    }

    // state functions

    /// @notice Emit metadata event
    /// @dev Access Control: operator
    ///      State Machine: always
    /// @param metadata bytes data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Called by the staker to increase the stake
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: staker OR operator
    ///      State Machine: before isTerminated()
    /// @param amountToAdd uint256 amount of tokens (18 decimals) to be added to the stake
    function increaseStake(uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isOperator(msg.sender), "only staker or operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // declare variable in memory
        address staker = _data.staker;

        // add stake
        Staking._addStake(Griefing.getTokenID(staker), staker, msg.sender, amountToAdd);
    }

    /// @notice Called by the counterparty to increase the stake
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: before isTerminated()
    /// @param amountToAdd uint256 amount of tokens (18 decimals) to be added to the stake
    function reward(uint256 amountToAdd) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // declare variable in memory
        address staker = _data.staker;

        // add stake
        Staking._addStake(Griefing.getTokenID(staker), staker, msg.sender, amountToAdd);
    }

    /// @notice Called by the counterparty to punish the stake
    ///          - burns the punishment from the stake and a proportional amount from the counterparty balance
    ///          - the cost of the punishment is calculated with the `Griefing.getCost()` function using the predetermined griefing ratio
    ///          - tokens (ERC-20) are burned from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: before isTerminated()
    /// @param punishment uint256 amount of tokens (18 decimals) to be burned from the stake
    /// @param message bytes data (any format) to emit as event giving reason for the punishment
    /// @return cost uint256 amount of tokens (18 decimals) it cost to perform punishment
    function punish(uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // execute griefing
        return Griefing._grief(msg.sender, _data.staker, punishment, message);
    }

    /// @notice Called by the counterparty to release the stake to the staker
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: anytime
    /// @param amountToRelease uint256 amount of tokens (18 decimals) to be released from the stake
    function releaseStake(uint256 amountToRelease) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // declare variable in memory
        address staker = _data.staker;

        // release stake back to the staker
        Staking._takeStake(Griefing.getTokenID(staker), staker, staker, amountToRelease);
    }

    /// @notice Called by the staker to begin countdown to finalize the agreement
    /// @dev Access Control: staker OR operator
    ///      State Machine: before Countdown.isActive()
    /// @return deadline uint256 timestamp (Unix seconds) at which the agreement will be finalized
    function startCountdown() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isOperator(msg.sender), "only staker or operator");

        // require countdown is not started
        require(isInitialized(), "deadline already set");

        // start countdown
        return Countdown._start();
    }

    /// @notice Called by anyone to return the remaining stake once the agreement has ended
    /// @dev Access Control: anyone
    ///      State Machine: after Countdown.isOver()
    /// @return amount uint256 amount of tokens (18 decimals) returned
    function returnStake() public returns (uint256 amount) {
        // require deadline is passed
        require(isTerminated(), "deadline not passed");

        // declare variable in memory
        address staker = _data.staker;

        // retrieve stake
        return Staking._takeFullStake(Griefing.getTokenID(staker), staker, staker);
    }

    /// @notice Called by the staker to retrieve the remaining stake once the agreement has ended
    /// @dev Access Control: staker OR operator
    ///      State Machine: after Countdown.isOver()
    /// @param recipient address of the account where to send the stake
    /// @return amount uint256 amount of tokens (18 decimals) retrieved
    function retrieveStake(address recipient) public returns (uint256 amount) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isOperator(msg.sender), "only staker or operator");

        // require deadline is passed
        require(isTerminated(), "deadline not passed");

        // declare variable in memory
        address staker = _data.staker;

        // retrieve stake
        return Staking._takeFullStake(Griefing.getTokenID(staker), staker, recipient);
    }

    /// @notice Called by the operator to transfer control to new operator
    /// @dev Access Control: operator
    ///      State Machine: anytime
    /// @param operator address of the new operator
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

    // view functions

    /// @notice Get the address of the staker (if set)
    /// @return staker address of the staker
    function getStaker() public view returns (address staker) {
        return _data.staker;
    }

    /// @notice Validate if the address matches the stored staker address
    /// @param caller address to validate
    /// @return validity bool true if matching address
    function isStaker(address caller) internal view returns (bool validity) {
        return caller == getStaker();
    }

    /// @notice Get the address of the counterparty (if set)
    /// @return counterparty address of counterparty account
    function getCounterparty() public view returns (address counterparty) {
        return _data.counterparty;
    }

    /// @notice Validate if the address matches the stored counterparty address
    /// @param caller address to validate
    /// @return validity bool true if matching address
    function isCounterparty(address caller) internal view returns (bool validity) {
        return caller == getCounterparty();
    }

    /// @notice Get the token ID and address used by the agreement
    /// @return tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return token address of the ERC20 token.
    function getToken() public view returns (TokenManager.Tokens tokenID, address token) {
        tokenID = Griefing.getTokenID(_data.staker);
        return (tokenID, TokenManager.getTokenAddress(tokenID));
    }

    /// @notice Get the current stake of the agreement
    /// @return stake uint256 amount of tokens (18 decimals) staked.
    function getStake() public view returns (uint256 stake) {
        return Deposit.getDeposit(Griefing.getTokenID(_data.staker), _data.staker);
    }

    /// @notice Validate if the current stake is greater than 0
    /// @return validity bool true if non-zero stake
    function isStaked() public view returns (bool validity) {
        uint256 currentStake = getStake();
        return currentStake > 0;
    }

    enum AgreementStatus { isInitialized, isInCountdown, isTerminated }
    /// @notice Get the status of the state machine
    /// @return status AgreementStatus from the following states:
    ///          - isInitialized: initialized but no deposits made
    ///          - isInCountdown: staker has triggered countdown to termination
    ///          - isTerminated: griefing agreement is over, staker can retrieve stake
    function getAgreementStatus() public view returns (AgreementStatus status) {
        if (Countdown.isOver()) {
            return AgreementStatus.isTerminated;
        } else if (Countdown.isActive()) {
            return AgreementStatus.isInCountdown;
        } else {
            return AgreementStatus.isInitialized;
        }
    }

    /// @notice Validate if the state machine is in the AgreementStatus.isInitialized state
    /// @return validity bool true if correct state
    function isInitialized() internal view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isInitialized;
    }

    /// @notice Validate if the state machine is in the AgreementStatus.isInCountdown state
    /// @return validity bool true if correct state
    function isInCountdown() internal view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isInCountdown;
    }

    /// @notice Validate if the state machine is in the AgreementStatus.isTerminated state
    /// @return validity bool true if correct state
    function isTerminated() internal view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isTerminated;
    }
}
