pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract Staking {

    using SafeMath for uint256;

    address private _token;
    mapping (address => uint256) private _stake;

    event TokenSet(address token);
    event StakeAdded(address staker, address funder, uint256 amount, uint256 newStake);
    event StakeTaken(address staker, address recipient, uint256 amount, uint256 newStake);
    event StakeBurned(address staker, uint256 amount, uint256 newStake);

    modifier tokenMustBeSet() {
        require(_token != address(0), "token not set yet");
        _;
    }

    // state functions

    function _setToken(address token) internal {
        // set storage
        _token = token;

        // emit event
        emit TokenSet(token);
    }

    function _addStake(address staker, address funder, uint256 currentStake, uint256 amountToAdd) internal tokenMustBeSet {
        // require current stake amount matches expected amount
        require(currentStake == _stake[staker], "current stake incorrect");

        // require non-zero stake to add
        require(amountToAdd > 0, "no stake to add");

        // transfer the stake amount
        require(IERC20(_token).transferFrom(funder, address(this), amountToAdd), "token transfer failed");

        // calculate new stake amount
        uint256 newStake = currentStake.add(amountToAdd);

        // set new stake to storage
        _stake[staker] = newStake;

        // emit event
        emit StakeAdded(staker, funder, amountToAdd, newStake);
    }

    function _takeStake(address staker, address recipient, uint256 currentStake, uint256 amountToTake) internal tokenMustBeSet {
        // require current stake amount matches expected amount
        require(currentStake == _stake[staker], "current stake incorrect");

        // require non-zero stake to take
        require(amountToTake > 0, "no stake to take");

        // amountToTake has to be less than equal currentStake
        require(amountToTake <= currentStake, "cannot take more than currentStake");

        // transfer the stake amount
        require(IERC20(_token).transfer(recipient, amountToTake), "token transfer failed");

        // calculate new stake amount
        uint256 newStake = currentStake.sub(amountToTake);

        // set new stake to storage
        _stake[staker] = newStake;

        // emit event
        emit StakeTaken(staker, recipient, amountToTake, newStake);
    }

    function _takeFullStake(address staker, address recipient) internal tokenMustBeSet returns (uint256 stake) {
        // get stake from storage
        stake = _stake[staker];

        // take full stake
        _takeStake(staker, recipient, stake, stake);
    }

    function _burnStake(address staker, uint256 currentStake, uint256 amountToBurn) tokenMustBeSet internal {
        // require current stake amount matches expected amount
        require(currentStake == _stake[staker], "current stake incorrect");

        // require non-zero stake to burn
        require(amountToBurn > 0, "no stake to burn");

        // amountToTake has to be less than equal currentStake
        require(amountToBurn <= currentStake, "cannot burn more than currentStake");

        // burn the stake amount
        ERC20Burnable(_token).burn(amountToBurn);

        // calculate new stake amount
        uint256 newStake = currentStake.sub(amountToBurn);

        // set new stake to storage
        _stake[staker] = newStake;

        // emit event
        emit StakeBurned(staker, amountToBurn, newStake);
    }

    function _burnFullStake(address staker) internal tokenMustBeSet returns (uint256 stake) {
        // get stake from storage
        stake = _stake[staker];

        // burn full stake
        _burnStake(staker, stake, stake);
    }

    // view functions

    function getStake(address staker) public view returns (uint256 stake) {
        stake = _stake[staker];
    }

    function getToken() public view returns (address token) {
        token = _token;
    }

}
