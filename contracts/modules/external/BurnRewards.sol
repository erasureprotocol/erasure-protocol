pragma solidity 0.5.16;

import "../NMRUtils.sol";

/// @title BurnRewards
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @notice This contract stores and distributes burn rewards.
contract BurnRewards is NMRUtils {

    uint256 private _rewardRatio;

    event RewardClaimed(address indexed source, address indexed recipient, uint256 burnAmount, uint256 rewardAmount);

    // Reward ratio of 10 means that the contract needs to be funded with 1,000,000 in order to suport burning of 10,000,000 supply
    constructor (uint256 rewardRatio) public {
        require(rewardRatio > 0, "ratio cannot be zero");
        _rewardRatio = rewardRatio;
    }

    /// @notice Burns a specific amount of NMR from the target address and distributes burn reward.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    /// @param rewardRecipient address The account to receive the burn reward.
    /// @return reward uint256 The amount of NMR (18 decimals) rewarded.
    function burnAndClaim(address from, uint256 value, address rewardRecipient) public returns (uint256 reward) {
        // calculate reward amount
        reward = value / _rewardRatio;

        // perform NMR burn
        NMRUtils._burnFrom(from, value);

        // transfer burn reward to recipient
        NMRUtils._transfer(rewardRecipient, reward);

        // emit event
        emit RewardClaimed(from, rewardRecipient, value, reward);

        // return reward amount
        return reward;
    }

    /// @notice Returns the reward ratio.
    /// @return rewardRatio uint256 The ratio at which rewards are calculated.
    function getRewardRatio() public view returns (uint256 rewardRatio) {
        return _rewardRatio;
    }

    /// @notice Returns the NMR balance remaining in this burn reward pool.
    /// @return amount uint256 The amount of NMR (18 decimals) remaining.
    function getPoolBalance() public view returns (uint256 amount) {
        return IERC20(NMRUtils.getTokenAddress()).balanceOf(address(this));
    }

    /// @notice Returns the NMR token address.
    /// @return nmrAddress address The address of the NMR token.
    function getNMRAddress() public pure returns (address nmrAddress) {
        return NMRUtils.getTokenAddress();
    }
}
