pragma solidity ^0.5.0;


/* Deadline
 *
 * TODO:
 * - Review if isAfterDeadline() behaves correctly when _deadline not set
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

    function isAfterDeadline() public view returns (bool status) {
        status = (now >= _deadline);
    }

    // modifiers

    modifier onlyAfterDeadline() {
        require(isAfterDeadline(), 'only after deadline');
        _;
    }

    modifier onlyBeforeDeadline() {
        require(!isAfterDeadline(), 'only before deadline');
        _;
    }

}
