pragma solidity 0.5.16;

import "./BurnDAI.sol";

/// @title TokenManager
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module provides a standard interface for interacting with supported ERC20 tokens.
contract TokenManager is BurnDAI {

    enum Tokens { NaN, NMR, DAI }

    /// @notice Get the address of the given token ID.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return tokenAddress address of the ERC20 token.
    function getTokenAddress(Tokens tokenID) public pure returns (address tokenAddress) {
        if (tokenID == Tokens.DAI)
            return BurnDAI.getTokenAddress();
        if (tokenID == Tokens.NMR)
            return BurnNMR.getTokenAddress();
        return address(0);
    }

    /// @notice Get the address of the uniswap exchange for given token ID.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return exchangeAddress address of the uniswap exchange.
    function getExchangeAddress(Tokens tokenID) public pure returns (address exchangeAddress) {
        if (tokenID == Tokens.DAI)
            return BurnDAI.getExchangeAddress();
        if (tokenID == Tokens.NMR)
            return BurnNMR.getExchangeAddress();
        return address(0);
    }

    modifier onlyValidTokenID(Tokens tokenID) {
        require(isValidTokenID(tokenID), 'invalid tokenID');
        _;
    }

    /// @notice Validate the token ID is a supported token.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return validity bool true if the token is supported.
    function isValidTokenID(Tokens tokenID) internal pure returns (bool validity) {
        return tokenID == Tokens.NMR || tokenID == Tokens.DAI;
    }

    /// @notice ERC20 ransfer.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param to address of the recipient.
    /// @param value uint256 amount of tokens.
    function _transfer(Tokens tokenID, address to, uint256 value) internal onlyValidTokenID(tokenID) {
        require(IERC20(getTokenAddress(tokenID)).transfer(to, value), 'token transfer failed');
    }

    /// @notice ERC20 TransferFrom
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to spend from.
    /// @param to address of the recipient.
    /// @param value uint256 amount of tokens.
    function _transferFrom(Tokens tokenID, address from, address to, uint256 value) internal onlyValidTokenID(tokenID) {
        require(IERC20(getTokenAddress(tokenID)).transferFrom(from, to, value), 'token transfer failed');
    }

    /// @notice ERC20 Burn
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param value uint256 amount of tokens.
    function _burn(Tokens tokenID, uint256 value) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            BurnDAI._burn(value);
        } else if (tokenID == Tokens.NMR) {
            BurnNMR._burn(value);
        }
    }

    /// @notice ERC20 BurnFrom
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to burn from.
    /// @param value uint256 amount of tokens.
    function _burnFrom(Tokens tokenID, address from, uint256 value) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            BurnDAI._burnFrom(from, value);
        } else if (tokenID == Tokens.NMR) {
            BurnNMR._burnFrom(from, value);
        }
    }

    /// @notice ERC20 Approve
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param spender address of the spender.
    /// @param value uint256 amount of tokens.
    function _approve(Tokens tokenID, address spender, uint256 value) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            require(IERC20(BurnDAI.getTokenAddress()).approve(spender, value), 'token approval failed');
        } else if (tokenID == Tokens.NMR) {
            address nmr = BurnNMR.getTokenAddress();
            uint256 currentAllowance = IERC20(nmr).allowance(msg.sender, spender);
            require(iNMR(nmr).changeApproval(spender, currentAllowance, value), 'token approval failed');
        }
    }

    /// @notice ERC20 TotalSupply
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return value uint256 amount of tokens.
    function totalSupply(Tokens tokenID) internal view onlyValidTokenID(tokenID) returns (uint256 value) {
        return IERC20(getTokenAddress(tokenID)).totalSupply();
    }

    /// @notice ERC20 BalanceOf
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param who address of the owner.
    /// @return value uint256 amount of tokens.
    function balanceOf(Tokens tokenID, address who) internal view onlyValidTokenID(tokenID) returns (uint256 value) {
        return IERC20(getTokenAddress(tokenID)).balanceOf(who);
    }

    /// @notice ERC20 Allowance
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param owner address of the owner.
    /// @param spender address of the spender.
    /// @return value uint256 amount of tokens.
    function allowance(Tokens tokenID, address owner, address spender) internal view onlyValidTokenID(tokenID) returns (uint256 value) {
        return IERC20(getTokenAddress(tokenID)).allowance(owner, spender);
    }
}