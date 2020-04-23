pragma solidity 0.5.16;

import "../modules/iNMR.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/// @title BurnRewards
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This contract stores and distributes burn rewards.
// TODO: should it use curve instead of ratio?
// TODO: should it be possible to reverse? --> would open us up to censorship
contract BurnRewards {

    using SafeMath for uint256;

    // Reward ratio of 10 means that the contract needs to be funded with 1,000,000 in order to suport burning of 10,000,000 supply
    uint256 private _rewardRatio;
    // address of the token
    address private constant _NMRToken = address(0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671);

    event RewardClaimed(address indexed source, address indexed recipient, uint256 burnAmount, uint256 rewardAmount);

    constructor (uint256 rewardRatio) public {
        _rewardRatio = rewardRatio;
    }

    /// @notice Burns a specific amount of NMR from the target address and distributes burn reward.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    /// @param rewardRecipient address The account to receive the burn reward.
    /// @return reward uint256 The amount of NMR (18 decimals) rewarded.
    function claim(address from, uint256 value, address rewardRecipient) public returns (uint256 reward) {
        reward = value.div(_rewardRatio);
        
        require(iNMR(_NMRToken).numeraiTransfer(from, value), "BurnRewards/claim: nmr.numeraiTransfer call failed");
        require(iNMR(_NMRToken).transfer(rewardRecipient, reward), "BurnRewards/claim: nmr.transfer call failed");

        emit RewardClaimed(msg.sender, rewardRecipient, value, reward);

        return reward;
    }

    /// @notice Returns the NMR balance remaining in this burn reward pool.
    /// @return amount uint256 The amount of NMR (18 decimals) remaining.
    function getPoolBalance() public view returns (uint256 amount) {
        return iNMR(_NMRToken).balanceOf(address(this));
    }
}
