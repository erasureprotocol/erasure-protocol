pragma solidity ^0.5.0;

import "../helpers/DecimalMath.sol";
import "./Staking.sol";


contract Griefing is Staking {

    enum RatioType { NaN, Inf, Dec }

    mapping (address => GriefRatio) private _griefRatio;
    struct GriefRatio {
        uint256 ratio;
        RatioType ratioType;
   }

    event RatioSet(address staker, uint256 ratio, RatioType ratioType);
    event Griefed(address punisher, address staker, uint256 punishment, uint256 cost, bytes message);

    uint256 internal constant e18 = uint256(10) ** uint256(18);

    // state functions

    function _setRatio(address staker, uint256 ratio, RatioType ratioType) internal {
        if (ratioType == RatioType.NaN || ratioType == RatioType.Inf) {
            require(ratio == 0, "ratio must be 0 when ratioType is NaN or Inf");
        }

        // set data in storage
        _griefRatio[staker].ratio = ratio;
        _griefRatio[staker].ratioType = ratioType;

        // emit event
        emit RatioSet(staker, ratio, ratioType);
    }

    function _grief(
        address punisher,
        address staker,
        uint256 currentStake,
        uint256 punishment,
        bytes memory message
    ) internal returns (uint256 cost) {

        // prevent accidental double punish
        // cannot be strict equality to prevent frontrunning
        require(currentStake <= Staking.getStake(staker), "current stake incorrect");

        // get grief data from storage
        uint256 ratio = _griefRatio[staker].ratio;
        RatioType ratioType = _griefRatio[staker].ratioType;

        require(ratioType != RatioType.NaN, "no punishment allowed");

        // calculate cost
        // getCost also acts as a guard when _setRatio is not called before
        cost = getCost(ratio, punishment, ratioType);

        // burn the cost from the punisher's balance
        BurnNMR._burnFrom(punisher, cost);

        // burn the punishment from the target's stake
        Staking._burnStake(staker, currentStake, punishment);

        // emit event
        emit Griefed(punisher, staker, punishment, cost, message);
    }

    // view functions

    function getRatio(address staker) public view returns (uint256 ratio, RatioType ratioType) {
        // get stake data from storage
        ratio = _griefRatio[staker].ratio;
        ratioType = _griefRatio[staker].ratioType;
    }

    // pure functions

    function getCost(uint256 ratio, uint256 punishment, RatioType ratioType) public pure returns(uint256 cost) {
        /*  Dec:  Cost multiplied by ratio interpreted as a decimal number with 18 decimals, e.g. 1 -> 1e18
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (ratioType == RatioType.Dec) {
            return DecimalMath.mul(SafeMath.mul(punishment, e18), ratio) / e18;
        }
        if (ratioType == RatioType.Inf)
            return 0;
        if (ratioType == RatioType.NaN)
            revert("ratioType cannot be RatioType.NaN");
    }

    function getPunishment(uint256 ratio, uint256 cost, RatioType ratioType) public pure returns(uint256 punishment) {
        /*  Dec: Ratio is a decimal number with 18 decimals
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (ratioType == RatioType.Dec) {
            return DecimalMath.div(SafeMath.mul(cost, e18), ratio) / e18;
        }
        if (ratioType == RatioType.Inf)
            revert("ratioType cannot be RatioType.Inf");
        if (ratioType == RatioType.NaN)
            revert("ratioType cannot be RatioType.NaN");
    }

}
