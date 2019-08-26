pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Griefing.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/* Agreement between two stakers
 * - each staker has the ability to grief each other
 *
 * NOTE:
 * - This top level contract should only perform access control and state transitions
 *
 */
contract SimpleGriefing is Griefing, Metadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address stakerA;
        address stakerB;
    }

    function initialize(
        address token,
        address operator,
        address stakerA,
        address stakerB,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        bytes memory staticMetadata
    ) public initializeTemplate() {

        // set storage values
        _data.stakerA = stakerA;
        _data.stakerB = stakerB;

        // decode staker data and set griefing ratios
        if (stakeDataA.length > 0) {
            (uint256 ratioA, Griefing.RatioType ratioTypeA) = abi.decode(stakeDataA, (uint256, Griefing.RatioType));
            Griefing._setRatio(stakerA, ratioA, ratioTypeA);
        }
        if (stakeDataB.length > 0) {
            (uint256 ratioB, Griefing.RatioType ratioTypeB) = abi.decode(stakeDataB, (uint256, Griefing.RatioType));
            Griefing._setRatio(stakerB, ratioB, ratioTypeB);
        }

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set token used for staking
        Staking._setToken(token);

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // update metadata
        Metadata._setVariableMetadata(variableMetadata);
    }

    function increaseStake(address staker, uint256 currentStake, uint256 amountToAdd) public {
        // check if valid staker input
        require(isStaker(staker), "only registered staker");

        // restrict access
        require(staker == msg.sender || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // add stake from msg.sender
        Staking._addStake(staker, msg.sender, currentStake, amountToAdd);
    }

    function reward(address staker, uint256 currentStake, uint256 amountToAdd) public {
        // check if valid staker input
        require(isStaker(staker), "only registered staker");

        // the sender must be the counterparty of the staker rewarded
        address counterparty = getCounterparty(staker);

        // restrict access
        require(msg.sender == counterparty || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

         // add stake to the counterparty
        Staking._addStake(staker, msg.sender, currentStake, amountToAdd);
    }

    function punish(address target, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // check if valid target input
        require(isStaker(target), "only registered staker");

        // the sender must be the counterparty of the target to be punished
        address counterparty = getCounterparty(target);

        // restrict access
        require(msg.sender == counterparty || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // execute griefing from msg.sender
        cost = Griefing._grief(msg.sender, target, punishment, message);
    }

    function releaseStake(address staker) public returns (uint256 amount) {
        // check if valid staker input
        require(isStaker(staker), "only registered staker");

        // sender must be the counterparty of staker
        address counterparty = getCounterparty(staker);

        // restrict access
        require(msg.sender == counterparty || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        if (Staking.getStake(staker) > 0) {
            amount = Staking._takeFullStake(staker, staker);
        }
    }

    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    function renounceOperator() public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._renounceOperator();
    }

    // view functions

    function isStaker(address caller) public view returns (bool ok) {
        // returns true if caller is one of the registered stakers
        ok = (caller == _data.stakerA || caller == _data.stakerB);
    }

    function getCounterparty(address caller) public view returns (address counterparty) {
        // if stakerA, return stakerB
        // if stakerB, return stakerA
        if (_data.stakerA == caller) {
            return _data.stakerB;
        } else if (_data.stakerB == caller) {
            return _data.stakerA;
        }
        // don't revert when `caller` is not a staker
        // just return empty address and allow higher level functions
        // to do error-handling with isStaker
        return address(0);
    }
}
