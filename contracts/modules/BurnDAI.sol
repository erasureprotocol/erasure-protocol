pragma solidity 0.5.16;

import "./BurnNMR.sol";
import "../helpers/UniswapExchangeInterface.sol";

/// @title BurnDAI
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module allows for burning DAI tokens by exchanging them for NMR on uniswap and burning the NMR.
contract BurnDAI is BurnNMR {

    // address of the token
    address private constant _DAIToken = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    // uniswap exchange of the token
    address private constant _DAIExchange = address(0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667);

    /// @notice Burns a specific amount of DAI from the target address and decrements allowance.
    /// @dev This implementation has no frontrunning protection.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of DAI (18 decimals) to be burned.
    /// @param rewardRecipient address The account to receive the burn reward.
    function _burnFrom(address from, uint256 value, address rewardRecipient, address burnRewards) internal returns (uint256 reward) {
        // transfer dai to this contract
        ERC20Utils._transferFrom(_DAIToken, from, address(this), value);

        // burn nmr
        reward = _burn(value, rewardRecipient, burnRewards);

        // return reward amount
        return reward;
    }

    /// @notice Burns a specific amount of DAI from this contract.
    /// @dev This implementation has no frontrunning protection.
    /// @param value uint256 The amount of DAI (18 decimals) to be burned.
    /// @param rewardRecipient address The account to receive the burn reward.
    function _burn(uint256 value, address rewardRecipient, address burnRewards) internal returns (uint256 reward) {
        // approve uniswap for token transfer
        ERC20Utils._approve(_DAIToken, _DAIExchange, value);

        // swap dai for nmr
        (uint256 amountNMR, uint256 amountETH) = getExpectedSwapAmount(value);
        uint256 tokens_bought = UniswapExchangeInterface(_DAIExchange).tokenToTokenSwapInput(
            value,
            amountNMR,
            amountETH,
            now,
            NMRUtils.getTokenAddress()
        );

        // burn nmr
        reward = BurnNMR._burn(tokens_bought, rewardRecipient, burnRewards);

        // return reward amount
        return reward;
    }

    /// @notice Get the amount of NMR and ETH required to sell a given amount of DAI.
    /// @param amountDAI uint256 The amount of DAI (18 decimals) to sell.
    /// @param amountNMR uint256 The amount of NMR (18 decimals) required.
    /// @param amountETH uint256 The amount of ETH (18 decimals) required.
    function getExpectedSwapAmount(uint256 amountDAI) internal view returns (uint256 amountNMR, uint256 amountETH) {
        amountETH = UniswapExchangeInterface(_DAIExchange).getTokenToEthInputPrice(amountDAI);
        amountNMR = UniswapExchangeInterface(BurnNMR.getExchangeAddress()).getEthToTokenInputPrice(amountETH);
        return (amountNMR, amountETH);
    }

    /// @notice Get the DAI token address.
    /// @return token address The DAI token address.
    function getTokenAddress() internal pure returns (address token) {
        token = _DAIToken;
    }

    /// @notice Get the DAI Uniswap exchange address.
    /// @return token address The DAI Uniswap exchange address.
    function getExchangeAddress() internal pure returns (address exchange) {
        exchange = _DAIExchange;
    }

}