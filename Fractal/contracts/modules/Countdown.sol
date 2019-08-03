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
        require(_length != 0, 'length not set');
        deadline = _length.add(now);
        Deadline._setDeadline(deadline);
    }

    // view functions

    function getLength() public view returns (uint256 length) {
        length = _length;
    }

    // if Deadline._setDeadline or Countdown._setLength is not called,
    // isOver will yield false
    function isOver() public view returns (bool status) {
        // when length or deadline not set,
        // countdown has not started, hence not isOver
        if (_length == 0 || Deadline.getDeadline() == 0) {
            status = false;
        } else {
            status = Deadline.isAfterDeadline();
        }
    }

    // timeRemaining will default to 0 if _setDeadline is not called
    // if the now exceeds deadline, just return 0 as the timeRemaining
    function timeRemaining() public view returns (uint256 time) {
        if (now >= Deadline.getDeadline()) {
            time = 0;
        } else {
            time = Deadline.getDeadline().sub(now);
        }
    }

}
