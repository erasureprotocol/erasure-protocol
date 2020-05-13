pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC20Utils
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module simplifies calling ERC20 functions using regular openzeppelin ERC20 interface and revert on failure.
contract ERC20Utils {

    /// @notice Forwards an approval to an other address.
    /// @param token address The address of the token.
    /// @param from address The source account.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of tokens.
    function _forwardApproval(address token, address from, address to, uint256 value) internal {
        // pull tokens
        require(IERC20(token).transferFrom(from, address(this), value), "ERC20Utils/_forwardApproval: erc20.transferFrom failed");
        // make approval
        _approve(token, to, value);
    }

    /// @notice Transfers to an account.
    /// @param token address The address of the token.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of tokens.
    function _transfer(address token, address to, uint256 value) internal {
        require(IERC20(token).transfer(to, value), "ERC20Utils/_transfer: erc20.transfer failed");
    }

    /// @notice Transfers from one account to an other.
    /// @param token address The address of the token.
    /// @param from address The source account.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of tokens.
    function _transferFrom(address token, address from, address to, uint256 value) internal {
        require(IERC20(token).transferFrom(from, to, value), "ERC20Utils/_transferFrom: erc20.transferFrom failed");
    }

    /// @notice Creates an approval.
    /// @param token address The address of the token.
    /// @param spender address The spender account.
    /// @param value uint256 The amount of tokens.
    function _approve(address token, address spender, uint256 value) internal {
        require(IERC20(token).approve(spender, value), "ERC20Utils/_approve: erc20.approve failed");
    }

}
