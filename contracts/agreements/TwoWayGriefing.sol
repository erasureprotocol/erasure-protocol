pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Countdown.sol";
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
contract TwoWayGriefing is Countdown, Griefing, Metadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address stakerA;
        address stakerB;
    }

    function initialize(
        address token,
        address operator,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        uint32 codeSize;
        assembly { codeSize := extcodesize(address) }
        require(codeSize == 0, "must be called within contract constructor");

        // decode staker data
        (address stakerA, uint256 ratioA, Griefing.RatioType ratioTypeA) = abi.decode(stakeDataA, (address, uint256, Griefing.RatioType));
        (address stakerB, uint256 ratioB, Griefing.RatioType ratioTypeB) = abi.decode(stakeDataB, (address, uint256, Griefing.RatioType));

        // set storage values
        _data.stakerA = stakerA;
        _data.stakerB = stakerB;

        // set griefing ratio
        Griefing._setRatio(stakerA, ratioA, ratioTypeA);
        Griefing._setRatio(stakerB, ratioB, ratioTypeB);

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set token used for staking
        Staking._setToken(token);

        // set countdown length
        Countdown._setLength(countdownLength);

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

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement ended");

        // add stake from msg.sender
        Staking._addStake(staker, msg.sender, currentStake, amountToAdd);
    }

    function punish(address target, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // check if valid target input
        require(isStaker(target), "only registered staker");

        // restrict access - NOTE: currently allows to grief self
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement ended");

        // execute griefing from msg.sender
        cost = Griefing._grief(msg.sender, target, punishment, message);
    }

    function startCountdown() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require countdown is not started
        require(Deadline.getDeadline() == 0, "deadline already set");

        // start countdown
        deadline = Countdown._start();
    }

    function retrieveStake(address staker, address recipient) public returns (uint256 amount) {
        // check if valid staker input
        require(isStaker(staker), "only registered staker");

        // restrict access
        require(staker == msg.sender || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require deadline is passed
        require(Deadline.isAfterDeadline(),"deadline not passed");

        // retrieve stake
        amount = Staking._takeFullStake(staker, recipient);
    }

    // view functions

    function isStaker(address caller) public view returns (bool ok) {
        // returns true if caller is one of the registered stakers
        ok = (caller == _data.stakerA || caller == _data.stakerB);
    }
}
