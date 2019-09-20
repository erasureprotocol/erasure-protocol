pragma solidity ^0.5.0;

import "../modules/Staking.sol";

contract TestStaking is Staking {
  uint256 private _fullStake;

    function getFullStake() public view returns(uint256 fullStake) {
        fullStake = _fullStake;
    }

    function addStake(address staker, address funder, uint256 currentStake, uint256 amountToAdd) public {
        Staking._addStake(staker, funder, currentStake, amountToAdd);
    }

    function takeStake(address staker, address recipient, uint256 currentStake, uint256 amountToTake) public {
        Staking._takeStake(staker, recipient, currentStake, amountToTake);
    }

    function takeFullStake(address staker, address recipient) public {
      _fullStake = Staking._takeFullStake(staker, recipient);
    }

    function burnStake(address staker, uint256 currentStake, uint256 amountToBurn) public {
        Staking._burnStake(staker, currentStake, amountToBurn);
    }

    function burnFullStake(address staker) public {
        _fullStake = Staking._burnFullStake(staker);
    }
}
