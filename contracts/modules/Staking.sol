pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenManager.sol";
import "./Deposit.sol";


/// @title Staking
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/modules/Staking.png
/// @notice This module wraps the Deposit functions and the ERC20 functions to provide combined actions.
contract Staking is Deposit, TokenManager {

    using SafeMath for uint256;

    event StakeBurned(TokenManager.Tokens tokenID, address staker, uint256 amount);

    /// @notice Transfer and deposit ERC20 tokens to this contract.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param funder Address of the funder from whom the tokens are transfered.
    /// @param amountToAdd uint256 amount of tokens (18 decimals) to be added to the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _addStake(TokenManager.Tokens tokenID, address staker, address funder, uint256 amountToAdd) internal returns (uint256 newStake) {
        // update deposit
        newStake = Deposit._increaseDeposit(tokenID, staker, amountToAdd);

        // transfer the stake amount
        TokenManager._transferFrom(tokenID, funder, address(this), amountToAdd);

        // explicit return
        return newStake;
    }

    /// @notice Withdraw some deposited stake and transfer to recipient.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param recipient Address of the recipient who receives the tokens.
    /// @param amountToTake uint256 amount of tokens (18 decimals) to be remove from the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _takeStake(TokenManager.Tokens tokenID, address staker, address recipient, uint256 amountToTake) internal returns (uint256 newStake) {
        // update deposit
        newStake = Deposit._decreaseDeposit(tokenID, staker, amountToTake);

        // transfer the stake amount
        TokenManager._transfer(tokenID, recipient, amountToTake);

        // explicit return
        return newStake;
    }

    /// @notice Withdraw all deposited stake and transfer to recipient.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param recipient Address of the recipient who receives the tokens.
    /// @return amountTaken uint256 amount of tokens (18 decimals) taken from the stake.
    function _takeFullStake(TokenManager.Tokens tokenID, address staker, address recipient) internal returns (uint256 amountTaken) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(tokenID, staker);

        // take full stake
        _takeStake(tokenID, staker, recipient, currentDeposit);

        // return
        return currentDeposit;
    }

    /// @notice Burn some deposited stake.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @param amountToBurn uint256 amount of tokens (18 decimals) to be burn from the stake.
    /// @return newStake uint256 amount of tokens (18 decimals) remaining in the stake.
    function _burnStake(TokenManager.Tokens tokenID, address staker, uint256 amountToBurn) internal returns (uint256 newStake) {
        // update deposit
        uint256 newDeposit = Deposit._decreaseDeposit(tokenID, staker, amountToBurn);

        // burn the stake amount
        TokenManager._burn(tokenID, amountToBurn);

        // emit event
        emit StakeBurned(tokenID, staker, amountToBurn);

        // return
        return newDeposit;
    }

    /// @notice Burn all deposited stake.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param staker Address of the staker who owns the stake.
    /// @return amountBurned uint256 amount of tokens (18 decimals) taken from the stake.
    function _burnFullStake(TokenManager.Tokens tokenID, address staker) internal returns (uint256 amountBurned) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(tokenID, staker);

        // burn full stake
        _burnStake(tokenID, staker, currentDeposit);

        // return
        return currentDeposit;
    }

}
