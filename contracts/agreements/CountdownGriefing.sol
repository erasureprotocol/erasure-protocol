pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../modules/Countdown.sol";
import "../modules/Griefing.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/// @title CountdownGriefing
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
/// @dev State Machine: https://www.lucidchart.com/publicSegments/view/8d81a581-e850-4e59-b102-d214c4ef724a/image.png
contract CountdownGriefing is Countdown, Griefing, EventMetadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address staker;
        address counterparty;
    }

    event Initialized(address operator, address staker, address counterparty, uint256 ratio, Griefing.RatioType ratioType, uint256 countdownLength, bytes metadata);

    function initialize(
        address operator,
        address staker,
        address counterparty,
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
            Operated._activateOperator();
        }

        // set griefing ratio
        Griefing._setRatio(staker, ratio, ratioType);

        // set countdown length
        Countdown._setLength(countdownLength);

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, staker, counterparty, ratio, ratioType, countdownLength, metadata);
    }

    // state functions

    function setMetadata(bytes memory metadata) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // update metadata
        EventMetadata._setMetadata(metadata);
    }

    function increaseStake(uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // add stake
        Staking._addStake(_data.staker, msg.sender, amountToAdd);
    }

    function reward(uint256 amountToAdd) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // add stake
        Staking._addStake(_data.staker, msg.sender, amountToAdd);
    }

    function punish(uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // require agreement is not ended
        require(!isTerminated(), "agreement ended");

        // execute griefing
        cost = Griefing._grief(msg.sender, _data.staker, punishment, message);
    }

    function releaseStake(uint256 amountToRelease) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // release stake back to the staker
        Staking._takeStake(_data.staker, _data.staker, amountToRelease);
    }

    function startCountdown() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require countdown is not started
        require(isInitialized(), "deadline already set");

        // start countdown
        deadline = Countdown._start();
    }

    function retrieveStake(address recipient) public returns (uint256 amount) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require deadline is passed
        require(isTerminated(), "deadline not passed");

        // retrieve stake
        amount = Staking._takeFullStake(_data.staker, recipient);
    }

    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    function renounceOperator() public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // renounce operator
        Operated._renounceOperator();
    }

    // view functions

    function isStaker(address caller) public view returns (bool validity) {
        return caller == getStaker();
    }

    function getStaker() public view returns (address staker) {
        return _data.staker;
    }

    function isCounterparty(address caller) public view returns (bool validity) {
        return caller == getCounterparty();
    }

    function getCounterparty() public view returns (address counterparty) {
        return _data.counterparty;
    }

    function isStaked() public view returns (bool validity) {
        return getStake() > 0;
    }

    function getStake() public view returns (uint256 stake) {
        return Staking.getStake(_data.staker);
    }

    enum AgreementStatus { isInitialized, isInCountdown, isTerminated }
    /// @notice Return the status of the state machine
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

    function isInitialized() public view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isInitialized;
    }

    function isInCountdown() public view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isInCountdown;
    }

    function isTerminated() public view returns (bool validity) {
        return getAgreementStatus() == AgreementStatus.isTerminated;
    }
}
