pragma solidity 0.5.16;

import "../modules/Deposit.sol";


contract TestDeposit is Deposit {

    function increaseDeposit(TokenManager.Tokens tokenID, address user, uint256 amountToAdd) public returns (uint256 newDeposit) {
       return Deposit._increaseDeposit(tokenID, user, amountToAdd);
    }

    function decreaseDeposit(TokenManager.Tokens tokenID, address user, uint256 amountToRemove) public returns (uint256 newDeposit) {
        return Deposit._decreaseDeposit(tokenID, user, amountToRemove);
    }

    function clearDeposit(TokenManager.Tokens tokenID, address user) public returns (uint256 amountRemoved) {
        return Deposit._clearDeposit(tokenID, user);
    }

    function _getDeposit(TokenManager.Tokens tokenID, address user) public view returns (uint256 deposit) {
        return Deposit.getDeposit(tokenID, user);
    }

}
