pragma solidity ^0.5.13;

import "./BurnDAI.sol";

/// @title Deposit
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module provides a standard interface for interacting with supported ERC20 tokens.
contract TokenManager is BurnDAI {

    enum Tokens { NaN, NMR, DAI }

    /// @notice Get the address of the given token ID.
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @return tokenAddress address of the ERC20 token.
    function getToken(Tokens token) internal pure returns (address tokenAddress) {
        require(isValidToken(token), 'invalid token');
        if (token == Tokens.DAI)
            return BurnDAI.getToken();
        if (token == Tokens.NMR)
            return BurnNMR.getToken();
    }

    /// @notice Validate the token ID is a supported token.
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @return validity bool true if the token is supported.
    function isValidToken(Tokens token) internal pure returns (bool validity) {
        return token == Tokens.NMR || token == Tokens.DAI;
    }

    /// @notice ERC20 ransfer.
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param to address of the recipient.
    /// @param value uint256 amount of tokens.
    function _transfer(Tokens token, address to, uint256 value) internal {
        require(IERC20(getToken(token)).transfer(to, value), 'token transfer failed');
    }

    /// @notice ERC20 TransferFrom
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to spend from.
    /// @param to address of the recipient.
    /// @param value uint256 amount of tokens.
    function _transferFrom(Tokens token, address from, address to, uint256 value) internal {
        require(IERC20(getToken(token)).transferFrom(from, to, value), 'token transfer failed');
    }

    /// @notice ERC20 Burn
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param value uint256 amount of tokens.
    function _burn(Tokens token, uint256 value) internal {
        if (token == Tokens.DAI) {
            BurnDAI._burn(value);
        } else if (token == Tokens.NMR) {
            BurnNMR._burn(value);
        } else {
            revert('invalid token');
        }
    }

    /// @notice ERC20 BurnFrom
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to burn from.
    /// @param value uint256 amount of tokens.
    function _burnFrom(Tokens token, address from, uint256 value) internal {
        if (token == Tokens.DAI) {
            BurnDAI._burnFrom(from, value);
        } else if (token == Tokens.NMR) {
            BurnNMR._burnFrom(from, value);
        } else {
            revert('invalid token');
        }
    }

    /// @notice ERC20 Approve
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param spender address of the spender.
    /// @param value uint256 amount of tokens.
    function _approve(Tokens token, address spender, uint256 value) internal {
        if (token == Tokens.DAI) {
            require(IERC20(BurnDAI.getToken()).approve(spender, value), 'token approval failed');
        } else if (token == Tokens.NMR) {
            address nmr = BurnNMR.getToken();
            uint256 currentAllowance = IERC20(nmr).allowance(msg.sender, spender);
            require(iNMR(nmr).changeApproval(spender, currentAllowance, value), 'token approval failed');
        } else {
            revert('invalid token');
        }
    }

    /// @notice ERC20 TotalSupply
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @return value uint256 amount of tokens.
    function totalSupply(Tokens token) internal view returns (uint256 value) {
        return IERC20(getToken(token)).totalSupply();
    }

    /// @notice ERC20 BalanceOf
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param who address of the owner.
    /// @return value uint256 amount of tokens.
    function balanceOf(Tokens token, address who) internal view returns (uint256 value) {
        return IERC20(getToken(token)).balanceOf(who);
    }

    /// @notice ERC20 Allowance
    /// @param token TokenManager.Tokens ID of the ERC20 token.
    /// @param owner address of the owner.
    /// @param spender address of the spender.
    /// @return value uint256 amount of tokens.
    function allowance(Tokens token, address owner, address spender) internal view returns (uint256 value) {
        return IERC20(getToken(token)).allowance(owner, spender);
    }
}