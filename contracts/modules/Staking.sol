pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "./BurnNMR.sol";


contract Staking is BurnNMR {

    using SafeMath for uint256;

    mapping (address => uint256) private _stake;

    event StakeAdded(address staker, address funder, uint256 amount, uint256 newStake);
    event StakeRemoved(address staker, uint256 amount, uint256 newStake);
    event StakeTaken(address staker, address recipient, uint256 amount);
    event StakeBurned(address staker, uint256 amount);

    function _addStake(address staker, address funder, uint256 currentStake, uint256 amountToAdd) internal {
        // require current stake amount matches expected amount
        require(currentStake == _stake[staker], "current stake incorrect");

        // require non-zero stake to add
        require(amountToAdd > 0, "no stake to add");

        // calculate new stake amount
        uint256 newStake = currentStake.add(amountToAdd);

        // set new stake to storage
        _stake[staker] = newStake;

        // transfer the stake amount
        require(IERC20(BurnNMR.getToken()).transferFrom(funder, address(this), amountToAdd), "token transfer failed");

        // emit event
        emit StakeAdded(staker, funder, amountToAdd, newStake);
    }

    function _removeStake(address staker, uint256 currentStake, uint256 amountToRemove) internal {
        // require current stake amount matches expected amount
        require(currentStake == _stake[staker], "current stake incorrect");

        // require non-zero stake to remove
        require(amountToRemove > 0, "no stake to remove");

        // amountToRemove has to be less than equal currentStake
        require(amountToRemove <= currentStake, "cannot remove more than currentStake");

        // calculate new stake amount
        uint256 newStake = currentStake.sub(amountToRemove);

        // set new stake to storage
        _stake[staker] = newStake;

        // emit event
        emit StakeRemoved(staker, amountToRemove, newStake);
    }

    function _removeFullStake(address staker) internal returns (uint256 stake) {
        // get stake from storage
        stake = _stake[staker];

        // take full stake
        _removeStake(staker, stake, stake);
    }

    function _takeStake(address staker, address recipient, uint256 currentStake, uint256 amountToTake) internal {
        // remove stake in storage
        _removeStake(staker, currentStake, amountToTake);

        // transfer the stake amount
        require(IERC20(BurnNMR.getToken()).transfer(recipient, amountToTake), "token transfer failed");

        // emit event
        emit StakeTaken(staker, recipient, amountToTake);
    }

    function _takeFullStake(address staker, address recipient) internal returns (uint256 stake) {
        // get stake from storage
        stake = _stake[staker];

        // take full stake
        _takeStake(staker, recipient, stake, stake);
    }

    function _burnStake(address staker, uint256 currentStake, uint256 amountToBurn) internal {
        // remove stake in storage
        _removeStake(staker, currentStake, amountToBurn);

        // burn the stake amount
        BurnNMR._burn(amountToBurn);

        // emit event
        emit StakeBurned(staker, amountToBurn);
    }

    function _burnFullStake(address staker) internal returns (uint256 stake) {
        // get stake from storage
        stake = _stake[staker];

        // burn full stake
        _burnStake(staker, stake, stake);
    }

    // view functions

    function getStake(address staker) public view returns (uint256 stake) {
        stake = _stake[staker];
    }

}
