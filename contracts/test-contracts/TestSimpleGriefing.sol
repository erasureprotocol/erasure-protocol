pragma solidity ^0.5.0;

import "../agreements/SimpleGriefing.sol";
import "./OperatorAccess.sol";

contract TestSimpleGriefing is SimpleGriefing, OperatorAccess {

    uint256 private _griefCost;

    function punish(uint256 currentStake, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        cost = SimpleGriefing.punish(currentStake, punishment, message);
        _griefCost = cost;
    }

    // view functions
    function getGriefCost() public view returns(uint256 cost) {
        cost = _griefCost;
    }
}
