pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";


/// @title Deadline
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/modules/Deadline.png
/// @notice This module allows for setting and validating a deadline.
///         The deadline makes use of block timestamps to determine end time.
contract Deadline {

    using SafeMath for uint256;

    uint256 private _deadline;

    event DeadlineSet(uint256 deadline);

    // state functions

    /// @notice Set the deadline
    /// @param deadline uint256 Unix timestamp to use as deadline.
    function _setDeadline(uint256 deadline) internal {
        _deadline = deadline;
        emit DeadlineSet(deadline);
    }

    // view functions

    /// @notice Get the timestamp of the deadline
    /// @return deadline uint256 Unix timestamp of the deadline.
    function getDeadline() public view returns (uint256 deadline) {
        return _deadline;
    }

    // timeRemaining will default to 0 if _setDeadline is not called
    // if the now exceeds deadline, just return 0 as the timeRemaining

    /// @notice Get the amount of time remaining until the deadline.
    ///         Returns 0 if deadline is not set or is passed.
    /// @return time uint256 Amount of time in seconds until deadline.
    function getTimeRemaining() public view returns (uint256 time) {
        if (_deadline > now)
            return _deadline.sub(now);
        else
            return 0;
    }

    enum DeadlineStatus { isNull, isSet, isOver }
    /// @notice Get the status of the state machine
    /// @return status DeadlineStatus from the following states:
    ///         - isNull: the deadline has not been set
    ///         - isSet: the deadline is set, but has not passed
    ///         - isOver: the deadline has passed
    function getDeadlineStatus() public view returns (DeadlineStatus status) {
        if (_deadline == 0)
            return DeadlineStatus.isNull;
        if (_deadline > now)
            return DeadlineStatus.isSet;
        else
            return DeadlineStatus.isOver;
    }

    /// @notice Validate if the state machine is in the DeadlineStatus.isNull state
    /// @return validity bool true if correct state
    function isNull() internal view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isNull;
    }

    /// @notice Validate if the state machine is in the DeadlineStatus.isSet state
    /// @return validity bool true if correct state
    function isSet() internal view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isSet;
    }

    /// @notice Validate if the state machine is in the DeadlineStatus.isOver state
    /// @return validity bool true if correct state
    function isOver() internal view returns (bool status) {
        return getDeadlineStatus() == DeadlineStatus.isOver;
    }

}
