pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract SimpleGriefing {

    using SafeMath for uint256;

    enum PunishType { CgtP, CltP, CeqP, Inf, NaN }

    Parameters private params;
    struct Parameters {
        address token;
    }

    mapping (address => StakeData) private _stakeData;
    struct StakeData {
        uint256 stake;
        uint256 ratio;
        PunishType punishType;
    }

    event StakeUpdated(address party, uint256 stake, uint256 ratio, PunishType punishType);
    event StakePunished(uint256 punishment, uint256 cost, bytes message);
    event StakeRetrieved(address party, address recipient, uint256 amount);

    // state functions

    function _setStake(address party, uint256 stake, uint256 ratio, PunishType punishType) internal {
        // set data in storage
        _stakeData[party] = StakeData(stake, ratio, punishType);

        // emit event
        emit StakeUpdated(party, stake, ratio, punishType);
    }

    function _grief(address from, address target, uint256 punishment, bytes memory message) internal returns (uint256 cost) {
        // get stake data from storage
        (uint256 stake, uint256 ratio, PunishType punishType) = getStake(target);

        // calculate cost from punisment value and punishment type
        cost = getCost(ratio, punishment, punishType);

        // burn the punishment from the target's stake
        ERC20Burnable(params.token).burn(punishment);

        // burn the cost from the caller's balance
        ERC20Burnable(params.token).burnFrom(from, cost);

        // set new stake data to storage
        _setStake(target, stake.sub(punishment), ratio, punishType);

        // emit event
        emit StakePunished(punishment, cost, message);
    }

    function _retrieve(address party, address recipient) internal returns (uint256 stake) {
        // get stake data from storage
        (uint256 currentStake, uint256 ratio, PunishType punishType) = getStake(party);

        // assign return value
        stake = currentStake;

        // require there is some stake to return
        require(stake > 0, "no stake to recover");

        // set new stake data to storage
        _setStake(party, 0, ratio, punishType);

        // transfer stake to the party
        require(IERC20(params.token).transfer(recipient, stake), "token transfer failed");

        // emit event
        emit StakeRetrieved(party, recipient, stake);
    }

    // view functions

    function getStake(address party) public view returns (uint256 stake, uint256 ratio, PunishType punishType) {
        // get stake data from storage
        stake = _stakeData[party].stake;
        ratio = _stakeData[party].ratio;
        punishType = _stakeData[party].punishType;
    }

    // pure functions

    function getCost(uint256 ratio, uint256 punishment, PunishType punishType) public pure returns(uint256 cost) {
        /*  CgtP: Cost greater than Punishment
         *  CltP: Cost less than Punishment
         *  CeqP: Cost equal to Punishment
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (punishType == PunishType.CgtP)
            return punishment.mul(ratio);
        if (punishType == PunishType.CltP)
            return punishment.div(ratio);
        if (punishType == PunishType.CeqP)
            return punishment;
        if (punishType == PunishType.Inf)
            return 0;
        if (punishType == PunishType.NaN)
            revert();
    }

    function getPunishment(uint256 ratio, uint256 cost, PunishType punishType) public pure returns(uint256 punishment) {
        /*  CgtP: Cost greater than Punishment
         *  CltP: Cost less than Punishment
         *  CeqP: Cost equal to Punishment
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (punishType == PunishType.CgtP)
            return cost.div(ratio);
        if (punishType == PunishType.CltP)
            return cost.mul(ratio);
        if (punishType == PunishType.CeqP)
            return cost;
        if (punishType == PunishType.Inf)
            revert();
        if (punishType == PunishType.NaN)
            revert();
    }

}
