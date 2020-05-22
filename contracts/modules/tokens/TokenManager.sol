pragma solidity 0.5.16;

import "./BurnDAI.sol";

/// @title TokenManager
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module provides a standard interface for interacting with supported ERC20 tokens.
/// TODO: update _burnRewards address
contract TokenManager is BurnDAI {

    enum Tokens { NaN, NMR, DAI }

    address private constant _burnRewards = address(0x0741fB496E58A1Fbc8cb9Ef9E096393e62582613);

    /// @notice Get the address of the given token ID.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @return tokenAddress address of the ERC20 token.
    function getTokenAddress(Tokens tokenID) public pure returns (address tokenAddress) {
        if (tokenID == Tokens.DAI)
            return BurnDAI.getTokenAddress();
        if (tokenID == Tokens.NMR)
            return NMRUtils.getTokenAddress();
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
        require(isValidTokenID(tokenID), 'TokenManager: invalid tokenID');
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
        ERC20Utils._transfer(getTokenAddress(tokenID), to, value);
    }

    /// @notice ERC20 TransferFrom
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to spend from.
    /// @param to address of the recipient.
    /// @param value uint256 amount of tokens.
    function _transferFrom(Tokens tokenID, address from, address to, uint256 value) internal onlyValidTokenID(tokenID) {
        ERC20Utils._transferFrom(getTokenAddress(tokenID), from, to, value);
    }

    /// @notice ERC20 Burn
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param value uint256 amount of tokens.
    /// @param rewardRecipient address The account to receive the burn reward.
    function _burn(Tokens tokenID, uint256 value, address rewardRecipient) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            BurnDAI._burn(value, rewardRecipient, _burnRewards);
        } else if (tokenID == Tokens.NMR) {
            BurnNMR._burn(value, rewardRecipient, _burnRewards);
        }
    }

    /// @notice ERC20 BurnFrom
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param from address to burn from.
    /// @param value uint256 amount of tokens.
    /// @param rewardRecipient address The account to receive the burn reward.
    function _burnFrom(Tokens tokenID, address from, uint256 value, address rewardRecipient) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            BurnDAI._burnFrom(from, value, rewardRecipient, _burnRewards);
        } else if (tokenID == Tokens.NMR) {
            BurnNMR._burnFrom(from, value, rewardRecipient, _burnRewards);
        }
    }

    /// @notice ERC20 Approve
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token.
    /// @param spender address of the spender.
    /// @param value uint256 amount of tokens.
    function _approve(Tokens tokenID, address spender, uint256 value) internal onlyValidTokenID(tokenID) {
        if (tokenID == Tokens.DAI) {
            ERC20Utils._approve(BurnDAI.getTokenAddress(), spender, value);
        } else if (tokenID == Tokens.NMR) {
            NMRUtils._changeApproval(spender, value);
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