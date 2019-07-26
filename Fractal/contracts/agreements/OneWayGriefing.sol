pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Countdown.sol";
import "../modules/SimpleGriefing.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";

/* Immediately engage with specific buyer
 * - Stake can be increased at any time
 * - Agreement is defined at the user level.
 * - Request to end agreement and recover stake takes 40 days to complete.
 * - No escrow of funds required.
 * - Buyer has Inf griefing.
 * - Payments are separate.
 *
 * TODO:
 * - Validate if state machine works as expected in edge cases
 */
contract OneWayGriefing is Countdown, SimpleGriefing, Metadata, Operated {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address token;
        address staker;
        address counterparty;
    }

    event Created(address indexed staker, address indexed counterparty, uint256 ratio, SimpleGriefing.PunishType punishType, address token, uint256 endDelay);

    constructor(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        SimpleGriefing.PunishType punishType,
        uint256 endDelay,
        bytes memory staticMetadata
    ) public {

        // set storage values
        _data.token = token;
        _data.staker = staker;
        _data.counterparty = counterparty;

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activate();
        }

        // set griefing params
        SimpleGriefing._setStake(staker, 0, ratio, punishType);

        // set countdown length
        Countdown._setLength(endDelay);

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // emit event
        emit Created(staker, counterparty, ratio, punishType, token, endDelay);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // update metadata
        Metadata._setVariableMetadata(variableMetadata);
    }

    function increaseStake(address from, uint256 currentStake, uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // get current stake amount
        (uint256 stake, uint256 ratio, SimpleGriefing.PunishType punishType) = SimpleGriefing.getStake(_data.staker);

        // calculate new sake amount
        uint256 newStake = stake.add(amountToAdd);

        // require current stake matches parameter to prevent front-running
        require(stake == currentStake, 'currentStake parameter does not match stake');

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // transfer amount
        require(IERC20(_data.token).transferFrom(from, address(this), amountToAdd), "token transfer failed");

        // add amount to stake storage
        SimpleGriefing._setStake(_data.staker, newStake, ratio, punishType);
    }

    function punish(address from, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // execute griefing
        cost = SimpleGriefing._grief(from, _data.staker, punishment, message);
    }

    function setDeadline() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // require countdown is not started
        require(Deadline.getDeadline() == 0, "deadline already set");

        // start countdown
        deadline = Countdown._start();
    }

    function retrieve(address recipient) public returns (uint256 amount) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // require deadline is passed
        require(Deadline.isAfterDeadline(),"deadline not passed");

        // retrieve stake
        amount = SimpleGriefing._retrieve(_data.staker, recipient);
    }

    // view functions

    function isStaker(address caller) public view returns (bool validity) {
        validity = (caller == _data.staker);
    }

    function isCounterparty(address caller) public view returns (bool validity) {
        validity = (caller == _data.counterparty);
    }
}
