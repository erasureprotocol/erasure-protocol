pragma solidity ^0.5.13;

import "../modules/Staking.sol";

contract TestStaking is Staking {
  uint256 private _fullStake;

    function getFullStake() public view returns(uint256 fullStake) {
        fullStake = _fullStake;
    }

    function addStake(TokenManager.Tokens token, address staker, address funder, uint256 amountToAdd) public {
        Staking._addStake(token, staker, funder, amountToAdd);
    }

    function takeStake(TokenManager.Tokens token, address staker, address recipient, uint256 amountToTake) public {
        Staking._takeStake(token, staker, recipient, amountToTake);
    }

    function takeFullStake(TokenManager.Tokens token, address staker, address recipient) public {
      _fullStake = Staking._takeFullStake(token, staker, recipient);
    }

    function burnStake(TokenManager.Tokens token, address staker, uint256 amountToBurn) public {
        Staking._burnStake(token, staker, amountToBurn);
    }

    function burnFullStake(TokenManager.Tokens token, address staker) public {
        _fullStake = Staking._burnFullStake(token, staker);
    }
}
