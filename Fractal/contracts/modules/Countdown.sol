pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./Deadline.sol";


/* Countdown timer
 *
 * TODO:
 * - Review if timeRemaining() and isOver() behave correctly when length not set or countdown not started
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
        require(_length != 0, 'length not set');
        deadline = _length.add(now);
        Deadline._setDeadline(deadline);
    }

    // view functions

    function getLength() public view returns (uint256 length) {
        length = _length;
    }

    // if Deadline._setDeadline is not called, isOver will yield true
    // due to now - 0 = now
    function isOver() public view returns (bool status) {
        // when length and deadline not set,
        // countdown has not started, hence not isOver
        if (_length == 0 && Deadline.getDeadline() == 0) {
            status = false;
        } else {
            status = Deadline.isAfterDeadline();
        }
    }

    // timeRemaining will throw from SafeMath subtraction overflow
    // if deadline is not set
    // due to 0 - now = -now
    function timeRemaining() public view returns (uint256 time) {
        require(_length != 0 && Deadline.getDeadline() != 0, "not started");
        time = Deadline.getDeadline().sub(now);
    }

}
