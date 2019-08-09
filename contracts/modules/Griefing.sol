pragma solidity ^0.5.0;

import "./Staking.sol";


contract Griefing is Staking {

    enum RatioType { NaN, CgtP, CltP, CeqP, Inf }

    mapping (address => GriefRatio) private _griefRatio;
    struct GriefRatio {
        uint256 ratio;
        RatioType ratioType;
    }

    event RatioSet(address staker, uint256 ratio, RatioType ratioType);
    event Griefed(address punisher, address staker, uint256 punishment, uint256 cost, bytes message);

    // state functions

    function _setRatio(address staker, uint256 ratio, RatioType ratioType) internal {
        // set data in storage
        _griefRatio[staker].ratio = ratio;
        _griefRatio[staker].ratioType = ratioType;

        // emit event
        emit RatioSet(staker, ratio, ratioType);
    }

    function _grief(address punisher, address staker, uint256 punishment, bytes memory message) internal returns (uint256 cost) {
        require(BurnNMR.getToken() != address(0), "token not set");

        // get grief data from storage
        uint256 ratio = _griefRatio[staker].ratio;
        RatioType ratioType = _griefRatio[staker].ratioType;

        require(ratioType != RatioType.NaN, "no punishment allowed");

        // calculate cost
        // getCost also acts as a guard when _setRatio is not called before
        cost = getCost(ratio, punishment, ratioType);

        // burn the cost from the punisher's balance
        BurnNMR._burnFrom(punisher, cost);

        // get stake from storage
        uint256 currentStake = Staking.getStake(staker);

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
        /*  CgtP: Cost greater than Punishment
         *  CltP: Cost less than Punishment
         *  CeqP: Cost equal to Punishment
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (ratioType == RatioType.CgtP)
            return punishment.mul(ratio);
        if (ratioType == RatioType.CltP)
            return punishment.div(ratio);
        if (ratioType == RatioType.CeqP)
            return punishment;
        if (ratioType == RatioType.Inf)
            return 0;
        if (ratioType == RatioType.NaN)
            revert("ratioType cannot be RatioType.NaN");
    }

    function getPunishment(uint256 ratio, uint256 cost, RatioType ratioType) public pure returns(uint256 punishment) {
        /*  CgtP: Cost greater than Punishment
         *  CltP: Cost less than Punishment
         *  CeqP: Cost equal to Punishment
         *  Inf:  Punishment at no cost
         *  NaN:  No Punishment */
        if (ratioType == RatioType.CgtP)
            return cost.div(ratio);
        if (ratioType == RatioType.CltP)
            return cost.mul(ratio);
        if (ratioType == RatioType.CeqP)
            return cost;
        if (ratioType == RatioType.Inf)
            revert("ratioType cannot be RatioType.Inf");
        if (ratioType == RatioType.NaN)
            revert("ratioType cannot be RatioType.NaN");
    }

}
