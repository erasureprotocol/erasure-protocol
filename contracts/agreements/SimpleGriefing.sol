pragma solidity ^0.5.13;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../modules/Griefing.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/// @title SimpleGriefing
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
/// @dev State Machine: https://www.lucidchart.com/publicSegments/view/cfc3418d-2079-4e61-8c9f-8950e47d4621/image.png
contract SimpleGriefing is Griefing, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address staker;
        address counterparty;
    }

    event Initialized(address operator, address staker, address counterparty, uint256 ratio, Griefing.RatioType ratioType, bytes metadata);

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator Address of the operator that overrides access control
    /// @param staker Address of the staker who owns the stake
    /// @param counterparty Address of the counterparty who has the right to punish and reward
    /// @param ratio Uint256 number (18 decimals) passed to Griefing module
    /// @param ratioType Uint8 number passed to Staking module
    /// @param metadata Data (any format) to emit as event on initialization
    function initialize(
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
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
        Griefing._setRatio(staker, ratio, ratioType);

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, staker, counterparty, ratio, ratioType, metadata);
    }

    // state functions

    /// @notice Emit metadata event
    /// @dev Access Control: operator
    ///      State Machine: always
    /// @param metadata Data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Called by the staker to increase the stake
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: staker OR operator
    ///      State Machine: anytime
    /// @param amountToAdd Amount of NMR (18 decimals) to be added to the stake
    function increaseStake(uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isOperator(msg.sender), "only staker or operator");

        // add stake
        Staking._addStake(_data.staker, msg.sender, amountToAdd);
    }

    /// @notice Called by the counterparty to increase the stake
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: anytime
    /// @param amountToAdd Amount of NMR (18 decimals) to be added to the stake
    function reward(uint256 amountToAdd) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // add stake
        Staking._addStake(_data.staker, msg.sender, amountToAdd);
    }

    /// @notice Called by the counterparty to punish the stake
    ///          - burns the amount of tokens set as punishment from the stake and a proportional amount from the counterparty balance based on the griefRatio
    ///          - tokens (ERC-20) are transfered from the caller and requires approval of this contract for appropriate amount
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: anytime
    /// @param punishment Amount of NMR (18 decimals) to be burned from the stake
    /// @param message Data (any format) to emit as event giving reason for the punishment
    /// @return cost Amount of NMR (18 decimals) it costs to perform punishment
    function punish(uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // execute griefing
        cost = Griefing._grief(msg.sender, _data.staker, punishment, message);
    }

    /// @notice Called by the counterparty to release the stake to the staker
    /// @dev Access Control: counterparty OR operator
    ///      State Machine: anytime
    /// @param amountToRelease Amount of NMR (18 decimals) to be released from the stake
    function releaseStake(uint256 amountToRelease) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isOperator(msg.sender), "only counterparty or operator");

        // release stake back to the staker
        Staking._takeStake(_data.staker, _data.staker, amountToRelease);
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

    // view functions

    /// @notice Get the address of the staker (if set)
    /// @return staker Staker account address
    function getStaker() public view returns (address staker) {
        return _data.staker;
    }

    /// @notice Validate if the address matches the stored staker address
    /// @param caller Address to validate
    /// @return validity True if matching address
    function isStaker(address caller) internal view returns (bool validity) {
        return caller == getStaker();
    }

    /// @notice Get the address of the counterparty (if set)
    /// @return counterparty Counterparty account address
    function getCounterparty() public view returns (address counterparty) {
        return _data.counterparty;
    }

    /// @notice Validate if the address matches the stored counterparty address
    /// @param caller Address to validate
    /// @return validity True if matching address
    function isCounterparty(address caller) internal view returns (bool validity) {
        return caller == getCounterparty();
    }

    /// @notice Get the current stake of the agreement
    /// @return stake Amount of NMR (18 decimals) staked
    function getCurrentStake() public view returns (uint256 stake) {
        return Staking.getStake(_data.staker);
    }

    enum AgreementStatus { isInitialized, isStaked }
    /// @notice Return the status of the state machine
    /// @return uint8 status from of the following states:
    ///          - isInitialized: initialized but no deposits made
    ///          - isStaked: stake is deposited
    function getAgreementStatus() public view returns (AgreementStatus status) {
        if (getCurrentStake() > 0) {
            return AgreementStatus.isStaked;
        } else {
            return AgreementStatus.isInitialized;
        }
    }

    function isInitialized() internal view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isInitialized;
    }

    function isStaked() internal view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isStaked;
    }
}
