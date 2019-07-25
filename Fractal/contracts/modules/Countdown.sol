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

    function setLength(uint256 length) internal {
        _length = length;
        emit LengthSet(length);
    }

    function start() internal returns (uint256 deadline) {
        require(_length != 0, 'length not set');
        deadline = _length.add(now);
        Deadline.setDeadline(deadline);
    }

    // view functions

    function getLength() public view returns (uint256 length) {
        length = _length;
    }

    function isOver() public view returns (bool status) {
        status = Deadline.isAfterDeadline();
    }

    function timeRemaining() public view returns (uint256 time) {
        time = Deadline.getDeadline().sub(now);
    }

    // modifiers

    modifier onlyEndedCountdown() {
        require(isOver(), 'only ended countdown');
        _;
    }

    modifier onlyActiveCountdown() {
        require(timeRemaining() > 0, 'only active countdown');
        _;
    }

}
