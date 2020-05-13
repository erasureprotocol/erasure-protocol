pragma solidity 0.5.16;

import "./NMRUtils.sol";
import "../../burnrewards/BurnRewards.sol";

/// @title BurnNMR
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module burns NMR and claims burn rewards.
contract BurnNMR is NMRUtils {

    // uniswap exchange of the token
    address private constant _NMRExchange = address(0x2Bf5A5bA29E60682fC56B2Fcf9cE07Bef4F6196f);

    /// @notice Burns a specific amount of NMR from this contract.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    /// @return reward uint256 The amount of NMR (18 decimals) rewarded.
    function _burn(uint256 value, address rewardRecipient, address burnRewards) internal returns (uint256 reward) {
        if (rewardRecipient == address(0)) {
            NMRUtils._burn(value);
        } else {
            NMRUtils._changeApproval(burnRewards, value);
            reward = BurnRewards(burnRewards).burnAndClaim(address(this), value, rewardRecipient);
        }
        return reward;
    }

    /// @notice Burns a specific amount of NMR from the target address and decrements allowance.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    /// @return reward uint256 The amount of NMR (18 decimals) rewarded.
    function _burnFrom(address from, uint256 value, address rewardRecipient, address burnRewards) internal returns (uint256 reward) {
        if (rewardRecipient == address(0)) {
            NMRUtils._burnFrom(from, value);
        } else {
            NMRUtils._forwardApproval(from, burnRewards, value);
            reward = BurnRewards(burnRewards).burnAndClaim(address(this), value, rewardRecipient);
        }
        return reward;
    }

    /// @notice Get the NMR Uniswap exchange address.
    /// @return token address The NMR Uniswap exchange address.
    function getExchangeAddress() internal pure returns (address exchange) {
        exchange = _NMRExchange;
    }

}
