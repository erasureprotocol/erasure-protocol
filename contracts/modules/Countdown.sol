pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Deadline.sol";


/// @title Countdown
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/modules/Countdown.png
/// @notice This module provides an arbitrary length countdown.
///         The countdown makes use of block timestamps to determine start time and end time.
contract Countdown is Deadline {

    using SafeMath for uint256;

    uint256 private _length;

    event LengthSet(uint256 length);

    // state functions

    /// @notice Set the length of the countdown
    /// @param length uint256 The amount of time in seconds.
    function _setLength(uint256 length) internal {
        _length = length;
        emit LengthSet(length);
    }

    /// @notice Start the countdown based on the current block timestamp
    /// @return deadline uint256 Unix timestamp of the end of the countdown (current timestamp + countdown length).
    function _start() internal returns (uint256 deadline) {
        deadline = _length.add(now);
        Deadline._setDeadline(deadline);
        return deadline;
    }

    // view functions

    /// @notice Get the length of the countdown in seconds
    /// @return length uint256 The amount of time in seconds.
    function getLength() public view returns (uint256 length) {
        return _length;
    }

    enum CountdownStatus { isNull, isSet, isActive, isOver }
    /// @notice Get the status of the state machine
    /// @return status CountdownStatus from the following states:
    ///         - isNull: the length has not been set
    ///         - isSet: the length is set, but the countdown is not started
    ///         - isActive: the countdown has started but not yet ended
    ///         - isOver: the countdown has completed
    function getCountdownStatus() public view returns (CountdownStatus status) {
        if (_length == 0)
            return CountdownStatus.isNull;
        if (Deadline.getDeadlineStatus() == DeadlineStatus.isNull)
            return CountdownStatus.isSet;
        if (Deadline.getDeadlineStatus() != DeadlineStatus.isOver)
            return CountdownStatus.isActive;
        else
            return CountdownStatus.isOver;
    }

    /// @notice Validate if the state machine is in the CountdownStatus.isNull state
    /// @return validity bool true if correct state
    function isNull() internal view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isNull;
    }

    /// @notice Validate if the state machine is in the CountdownStatus.isSet state
    /// @return validity bool true if correct state
    function isSet() internal view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isSet;
    }

    /// @notice Validate if the state machine is in the CountdownStatus.isActive state
    /// @return validity bool true if correct state
    function isActive() internal view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isActive;
    }

    /// @notice Validate if the state machine is in the CountdownStatus.isOver state
    /// @return validity bool true if correct state
    function isOver() internal view returns (bool validity) {
        return getCountdownStatus() == CountdownStatus.isOver;
    }

}
