pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";


/// @title Deposit
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Deposit {

    using SafeMath for uint256;

    mapping (address => uint256) private _deposit;

    event DepositIncreased(address user, uint256 amount, uint256 newDeposit);
    event DepositDecreased(address user, uint256 amount, uint256 newDeposit);

    function _increaseDeposit(address user, uint256 amountToAdd) internal returns (uint256 newDeposit) {
        // calculate new deposit amount
        newDeposit = _deposit[user].add(amountToAdd);

        // set new stake to storage
        _deposit[user] = newDeposit;

        // emit event
        emit DepositIncreased(user, amountToAdd, newDeposit);

        // return
        return newDeposit;
    }

    function _decreaseDeposit(address user, uint256 amountToRemove) internal returns (uint256 newDeposit) {
        // get current deposit
        uint256 currentDeposit = _deposit[user];

        // check if sufficient deposit
        require(currentDeposit >= amountToRemove, "insufficient deposit to remove");

        // calculate new deposit amount
        newDeposit = currentDeposit.sub(amountToRemove);

        // set new stake to storage
        _deposit[user] = newDeposit;

        // emit event
        emit DepositDecreased(user, amountToRemove, newDeposit);

        // return
        return newDeposit;
    }

    function _clearDeposit(address user) internal returns (uint256 amountRemoved) {
        // get current deposit
        uint256 currentDeposit = _deposit[user];

        // remove deposit
        _decreaseDeposit(user, currentDeposit);

        // return
        return currentDeposit;
    }

    // view functions

    function getDeposit(address user) public view returns (uint256 deposit) {
        return _deposit[user];
    }

}
