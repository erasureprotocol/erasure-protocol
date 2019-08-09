pragma solidity ^0.5.0;


/* Deadline
 *
 */
contract Deadline {

    uint256 private _deadline;

    event DeadlineSet(uint256 deadline);

    // state functions

    function _setDeadline(uint256 deadline) internal {
        _deadline = deadline;
        emit DeadlineSet(deadline);
    }

    // view functions

    function getDeadline() public view returns (uint256 deadline) {
        deadline = _deadline;
    }

    // if the _deadline is not set yet, isAfterDeadline will return true
    // due to now - 0 = now
    function isAfterDeadline() public view returns (bool status) {
        if (_deadline == 0) {
            status = false;
        } else {
            status = (now >= _deadline);
        }
    }

}
