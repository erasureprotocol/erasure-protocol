pragma solidity ^0.5.13;

import "./BurnNMR.sol";
import "../helpers/UniswapExchangeInterface.sol";

/// @title BurnNMR
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
/// @notice This module simplifies calling NMR burn functions using regular openzeppelin ERC20Burnable interface and revert on failure.
///         This helper is required given the non-standard implementation of the NMR burn functions: https://github.com/numerai/contract
contract BurnDAI is BurnNMR {

    // address of the token
    address private constant _DaiToken = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address private constant _DaiExchange = address(0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667);

    /// @notice Burns a specific amount of DAI from this contract.
    /// @param value uint256 The amount of DAI (18 decimals) to be burned.
    function _burnDai(uint256 value) internal {
        uint256 tokens_sold = value;
        uint256 min_tokens_bought = ;
        uint256 min_eth_bought = ;
        uint256 deadline = ;
        uint256 tokens_bought = UniswapExchangeInterface(_DaiExchange).tokenToTokenSwapInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, BurnNMR.getToken());

        BurnNMR._burn(tokens_bought);
    }

    /// @notice Burns a specific amount of DAI from the target address and decrements allowance.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of DAI (18 decimals) to be burned.
    function _burnDaiFrom(address from, uint256 value) internal {
    }

    /// @notice Get the DAI token address.
    /// @return token address The DAI token address.
    function getDaiToken() public pure returns (address token) {
        token = _DaiToken;
    }

    /// @notice Get the DAI Uniswap exchange address.
    /// @return token address The DAI Uniswap exchange address.
    function getDaiExchange() public pure returns (address token) {
        token = _DaiExchange;
    }

}
getInputPrice