pragma solidity ^0.5.13;

import "../modules/Griefing.sol";


contract TestGriefing is Griefing {

    uint256 private _griefCost;

    // expose the return value from _grief() to variable _griefCost
    function getGriefCost() public view returns(uint256 griefCost) {
        griefCost = _griefCost;
    }

    function addStake(address staker, address funder, uint256 amountToAdd) public {
        Staking._addStake(staker, funder, amountToAdd);
    }

    function setRatio(address staker, uint256 ratio, RatioType ratioType) public {
        Griefing._setRatio(staker, ratio, ratioType);
    }

    function grief(
        address punisher,
        address staker,
        uint256 punishment,
        bytes memory message
    ) public {
        _griefCost = Griefing._grief(punisher, staker, punishment, message);
    }
}
