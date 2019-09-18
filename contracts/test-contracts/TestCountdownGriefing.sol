pragma solidity ^0.5.0;

import "../agreements/CountdownGriefing.sol";
import "./OperatorAccess.sol";

contract TestCountdownGriefing is CountdownGriefing, OperatorAccess {

    uint256 private _griefCost;
    uint256 private _deadline;
    uint256 private _retrieveStakeAmount;

    function punish(uint256 currentStake, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        cost = CountdownGriefing.punish(currentStake, punishment, message);
        _griefCost = cost;
    }

    function retrieveStake(address recipient) public returns (uint256 amount) {
        amount = CountdownGriefing.retrieveStake(recipient);
        _retrieveStakeAmount = amount;
    }

    function startCountdown() public returns (uint256 deadline) {
        deadline = CountdownGriefing.startCountdown();
        _deadline = deadline;
    }

    function getDeadline() public view returns(uint256 deadline) {
        deadline = _deadline;
    }

    function getGriefCost() public view returns(uint256 cost) {
        cost = _griefCost;
    }

    function getRetrieveStakeAmount() public view returns(uint256 retrieveStakeAmount) {
        retrieveStakeAmount = _retrieveStakeAmount;
    }
}
