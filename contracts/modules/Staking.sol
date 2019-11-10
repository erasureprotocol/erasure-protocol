pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "./BurnNMR.sol";
import "./Deposit.sol";


/// @title Staking
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Staking is Deposit, BurnNMR {

    using SafeMath for uint256;

    event StakeAdded(address staker, address funder, uint256 amount);
    event StakeTaken(address staker, address recipient, uint256 amount);
    event StakeBurned(address staker, uint256 amount);

    function _addStake(address staker, address funder, uint256 amountToAdd) internal {
        // update deposit
        Deposit._increaseDeposit(staker, amountToAdd);

        // transfer the stake amount
        require(IERC20(BurnNMR.getToken()).transferFrom(funder, address(this), amountToAdd), "token transfer failed");

        // emit event
        emit StakeAdded(staker, funder, amountToAdd);
    }

    function _takeStake(address staker, address recipient, uint256 amountToTake) internal returns (uint256 newStake) {
        // update deposit
        uint256 newDeposit = Deposit._decreaseDeposit(staker, amountToTake);

        // transfer the stake amount
        require(IERC20(BurnNMR.getToken()).transfer(recipient, amountToTake), "token transfer failed");

        // emit event
        emit StakeTaken(staker, recipient, amountToTake);

        // return
        return newDeposit;
    }

    function _takeFullStake(address staker, address recipient) internal returns (uint256 amountTaken) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(staker);

        // take full stake
        _takeStake(staker, recipient, currentDeposit);

        // return
        return currentDeposit;
    }

    function _burnStake(address staker, uint256 amountToBurn) internal returns (uint256 newStake) {
        // update deposit
        uint256 newDeposit = Deposit._decreaseDeposit(staker, amountToBurn);

        // burn the stake amount
        BurnNMR._burn(amountToBurn);

        // emit event
        emit StakeBurned(staker, amountToBurn);

        // return
        return newDeposit;
    }

    function _burnFullStake(address staker) internal returns (uint256 amountBurned) {
        // get deposit
        uint256 currentDeposit = Deposit.getDeposit(staker);

        // burn full stake
        _burnStake(staker, currentDeposit);

        // return
        return currentDeposit;
    }

    // view functions

    function getStake(address staker) public view returns (uint256 stake) {
        return Deposit.getDeposit(staker);
    }

}
