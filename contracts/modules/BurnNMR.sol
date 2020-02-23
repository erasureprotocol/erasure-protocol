pragma solidity 0.5.16;

import "./iNMR.sol";

/// @title BurnNMR
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module simplifies calling NMR burn functions using regular openzeppelin ERC20Burnable interface and revert on failure.
///         This helper is required given the non-standard implementation of the NMR burn functions: https://github.com/numerai/contract
contract BurnNMR {

    // address of the token
    address private constant _NMRToken = address(0xe9E2dF04e6d699986A5E0f131Eb37aAAd4BA2bdC);
    // uniswap exchange of the token
    address private constant _NMRExchange = address(0xbFAAdabFab5e3Ff17f06dc15b128bfCc9fCCA7Ee);

    /// @notice Burns a specific amount of NMR from this contract.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    function _burn(uint256 value) internal {
        require(iNMR(_NMRToken).mint(value), "nmr burn failed");
    }

    /// @notice Burns a specific amount of NMR from the target address and decrements allowance.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    function _burnFrom(address from, uint256 value) internal {
        require(iNMR(_NMRToken).numeraiTransfer(from, value), "nmr burnFrom failed");
    }

    /// @notice Get the NMR token address.
    /// @return token address The NMR token address.
    function getTokenAddress() internal pure returns (address token) {
        token = _NMRToken;
    }

    /// @notice Get the NMR Uniswap exchange address.
    /// @return token address The NMR Uniswap exchange address.
    function getExchangeAddress() internal pure returns (address exchange) {
        exchange = _NMRExchange;
    }

}
