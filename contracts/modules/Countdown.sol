pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./Deadline.sol";


/* Countdown timer
 */
contract Countdown is Deadline {

    using SafeMath for uint256;

    uint256 private _length;

    event LengthSet(uint256 length);

    // state functions

    function _setLength(uint256 length) internal {
        _length = length;
        emit LengthSet(length);
    }

    function _start() internal returns (uint256 deadline) {
        deadline = _length.add(now);
        Deadline._setDeadline(deadline);
    }

    // view functions

    function getLength() public view returns (uint256 length) {
        length = _length;
    }

    enum CountdownStatus { isNull, isSet, isActive, isOver }
    /// Return the status of the state machine
    /// - isNull: the length has not been set
    /// - isSet: the length is set, but the countdown is not started
    /// - isActive: the countdown has started but not yet ended
    /// - isOver: the countdown has completed
    function getCountdownStatus() public view returns (CountdownStatus status) {
        if (Countdown.getLength() == 0)
            return CountdownStatus.isNull;
        if (getDeadlineStatus() == DeadlineStatus.isNull)
            return CountdownStatus.isSet;
        if (getDeadlineStatus() != DeadlineStatus.isOver)
            return CountdownStatus.isActive;
        else
            return CountdownStatus.isOver;
    }

    function isNull() public view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isNull;
    }

    function isSet() public view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isSet;
    }

    function isActive() public view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isActive;
    }

    function isOver() public view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isOver;
    }

    // helper to retain abi
    function timeRemaining() public view returns (uint256 time) {
        return Deadline.getTimeRemaining();
    }

}
