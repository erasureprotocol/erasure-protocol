pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";

/* Deadline
 *
 */
contract Deadline {

    using SafeMath for uint256;

    uint256 private _deadline;

    event DeadlineSet(uint256 deadline);

    // state functions

    function _setDeadline(uint256 deadline) internal {
        _deadline = deadline;
        emit DeadlineSet(deadline);
    }

    // view functions

    function getDeadline() public view returns (uint256 deadline) {
        return _deadline;
    }

    // timeRemaining will default to 0 if _setDeadline is not called
    // if the now exceeds deadline, just return 0 as the timeRemaining
    function getTimeRemaining() public view returns (uint256 time) {
        if (Deadline.getDeadline() > now)
            return Deadline.getDeadline().sub(now);
        else
            return 0;
    }

    enum DeadlineStatus { isNull, isSet, isOver }
    /// Return the status of the deadline state machine
    /// - isNull: the deadline has not been set
    /// - isSet: the deadline is set, but has not passed
    /// - isOver: the deadline has passed
    function getDeadlineStatus() public view returns (DeadlineStatus status) {
        if (Deadline.getDeadline() == 0)
            return DeadlineStatus.isNull;
        if (Deadline.getDeadline() > now)
            return DeadlineStatus.isSet;
        else
            return DeadlineStatus.isOver;
    }

    function isNull() public view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isNull;
    }

    function isSet() public view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isSet;
    }

    function isOver() public view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isOver;
    }

    // helper to retain abi
    function isAfterDeadline() public view returns (bool status) {
        return Deadline.isOver();
    }

}
