pragma solidity ^0.5.13;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "./TokenManager.sol";
import "./Deposit.sol";


/// @title Staking
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/v1.3.0/docs/state-machines/modules/Staking.png
/// @notice This module wraps the Deposit functions and the ERC20 functions to provide combined actions.
contract Staking is Deposit, TokenManager {

    using SafeMath for uint256;

    event StakeBurned(address staker, uint256 amount);

    /// @notice Transfer and deposit ERC20 tokens to this contract.
    /// @param token TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param funder Address of the funder from whom the tokens are transfered.
    /// @param amountToAdd uint256 amount of tokens (18 decimals) to be added to the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _addStake(TokenManager.Tokens token, address staker, address funder, uint256 amountToAdd) internal returns (uint256 newStake) {
        // update deposit
        newStake = Deposit._increaseDeposit(token, staker, amountToAdd);

        // transfer the stake amount
        TokenManager._transferFrom(token, funder, address(this), amountToAdd);

        // explicit return
        return newStake;
    }

    /// @notice Withdraw some deposited stake and transfer to recipient.
    /// @param token TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param recipient Address of the recipient who receives the tokens.
    /// @param amountToTake uint256 amount of tokens (18 decimals) to be remove from the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _takeStake(TokenManager.Tokens token, address staker, address recipient, uint256 amountToTake) internal returns (uint256 newStake) {
        // update deposit
        newStake = Deposit._decreaseDeposit(token, staker, amountToTake);

        // transfer the stake amount
        TokenManager._transfer(token, recipient, amountToTake);

        // explicit return
        return newStake;
    }

    /// @notice Withdraw all deposited stake and transfer to recipient.
    /// @param token TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param recipient Address of the recipient who receives the tokens.
    /// @return amountTaken uint256 amount of tokens (18 decimals) taken from the stake.
    function _takeFullStake(TokenManager.Tokens token, address staker, address recipient) internal returns (uint256 amountTaken) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(token, staker);

        // take full stake
        _takeStake(token, staker, recipient, currentDeposit);

        // return
        return currentDeposit;
    }

    /// @notice Burn some deposited stake.
    /// @param token TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param amountToBurn uint256 amount of tokens (18 decimals) to be burn from the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _burnStake(TokenManager.Tokens token, address staker, uint256 amountToBurn) internal returns (uint256 newStake) {
        // update deposit
        uint256 newDeposit = Deposit._decreaseDeposit(token, staker, amountToBurn);

        // burn the stake amount
        TokenManager._burn(token, amountToBurn);

        // emit event
        emit StakeBurned(staker, amountToBurn);

        // return
        return newDeposit;
    }

    /// @notice Burn all deposited stake.
    /// @param token TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @return amountBurned uint256 amount of tokens (18 decimals) taken from the stake.
    function _burnFullStake(TokenManager.Tokens token, address staker) internal returns (uint256 amountBurned) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(token, staker);

        // burn full stake
        _burnStake(token, staker, currentDeposit);

        // return
        return currentDeposit;
    }

}
