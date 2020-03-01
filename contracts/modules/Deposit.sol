pragma solidity 0.5.16;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenManager.sol";


/// @title Deposit
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @dev State Machine: https://github.com/erasureprotocol/erasure-protocol/blob/release/v1.3.x/docs/state-machines/modules/Deposit.png
/// @notice This module allows for tracking user deposits for fungible tokens.
contract Deposit {

    using SafeMath for uint256;

    mapping (uint256 => mapping (address => uint256)) private _deposit;

    event DepositIncreased(TokenManager.Tokens tokenID, address user, uint256 amount, uint256 newDeposit);
    event DepositDecreased(TokenManager.Tokens tokenID, address user, uint256 amount, uint256 newDeposit);

    /// @notice Increase the deposit of a user.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param user address of the user.
    /// @param amountToAdd uint256 amount by which to increase the deposit.
    /// @return newDeposit uint256 amount of the updated deposit.
    function _increaseDeposit(TokenManager.Tokens tokenID, address user, uint256 amountToAdd) internal returns (uint256 newDeposit) {
        // calculate new deposit amount
        newDeposit = _deposit[uint256(tokenID)][user].add(amountToAdd);

        // set new stake to storage
        _deposit[uint256(tokenID)][user] = newDeposit;

        // emit event
        emit DepositIncreased(tokenID, user, amountToAdd, newDeposit);

        // return
        return newDeposit;
    }

    /// @notice Decrease the deposit of a user.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param user address of the user.
    /// @param amountToRemove uint256 amount by which to decrease the deposit.
    /// @return newDeposit uint256 amount of the updated deposit.
    function _decreaseDeposit(TokenManager.Tokens tokenID, address user, uint256 amountToRemove) internal returns (uint256 newDeposit) {
        // get current deposit
        uint256 currentDeposit = _deposit[uint256(tokenID)][user];

        // check if sufficient deposit
        require(currentDeposit >= amountToRemove, "insufficient deposit to remove");

        // calculate new deposit amount
        newDeposit = currentDeposit.sub(amountToRemove);

        // set new stake to storage
        _deposit[uint256(tokenID)][user] = newDeposit;

        // emit event
        emit DepositDecreased(tokenID, user, amountToRemove, newDeposit);

        // return
        return newDeposit;
    }

    /// @notice Set the deposit of a user to zero.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param user address of the user.
    /// @return amountRemoved uint256 amount removed from deposit.
    function _clearDeposit(TokenManager.Tokens tokenID, address user) internal returns (uint256 amountRemoved) {
        // get current deposit
        uint256 currentDeposit = _deposit[uint256(tokenID)][user];

        // remove deposit
        _decreaseDeposit(tokenID, user, currentDeposit);

        // return
        return currentDeposit;
    }

    // view functions

    /// @notice Get the current deposit of a user.
    /// @param tokenID TokenManager.Tokens ID of the ERC20 token. This ID must be one of the IDs supported by TokenManager.
    /// @param user address of the user.
    /// @return deposit uint256 current amount of the deposit.
    function getDeposit(TokenManager.Tokens tokenID, address user) internal view returns (uint256 deposit) {
        return _deposit[uint256(tokenID)][user];
    }

}
