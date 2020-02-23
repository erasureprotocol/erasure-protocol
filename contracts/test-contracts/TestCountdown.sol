pragma solidity 0.5.16;

import "../modules/Countdown.sol";

contract TestCountdown is Countdown {

    function setDeadline(uint256 deadline) public {
        Deadline._setDeadline(deadline);
    }

    function setLength(uint256 length) public {
        Countdown._setLength(length);
    }

    function start() public {
        Countdown._start();
    }
}
