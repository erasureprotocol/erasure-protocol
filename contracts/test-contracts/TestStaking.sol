pragma solidity 0.5.16;

import "../modules/Staking.sol";

contract TestStaking is Staking {
    uint256 private _fullStake;

    function getFullStake() public view returns(uint256 fullStake) {
        return _fullStake;
    }

    function getStake(TokenManager.Tokens tokenID, address staker) public view returns (uint256 deposit) {
        return Deposit.getDeposit(tokenID, staker);
    }

    function addStake(TokenManager.Tokens tokenID, address staker, address funder, uint256 amountToAdd) public {
        Staking._addStake(tokenID, staker, funder, amountToAdd);
    }

    function takeStake(TokenManager.Tokens tokenID, address staker, address recipient, uint256 amountToTake) public {
        Staking._takeStake(tokenID, staker, recipient, amountToTake);
    }

    function takeFullStake(TokenManager.Tokens tokenID, address staker, address recipient) public {
        _fullStake = Staking._takeFullStake(tokenID, staker, recipient);
    }

    function burnStake(TokenManager.Tokens tokenID, address staker, uint256 amountToBurn) public {
        Staking._burnStake(tokenID, staker, amountToBurn);
    }

    function burnFullStake(TokenManager.Tokens tokenID, address staker) public {
        _fullStake = Staking._burnFullStake(tokenID, staker);
    }
}
