pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Countdown.sol";
import "../modules/Griefing.sol";
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
 *
 * NOTE:
 * - This top level contract should only perform access control and state transitions
 *
 */
contract OneWayGriefing is Countdown, Griefing, Metadata, Operated {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address token;
        address staker;
        address counterparty;
    }

    function initialize(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        uint32 codeSize;
        assembly {
            codeSize := extcodesize(address)
        }
        require(codeSize == 0, "must be called within contract constructor");

        // set storage values
        _data.token = token;
        _data.staker = staker;
        _data.counterparty = counterparty;

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activate();
        }

        // set griefing ratio
        Griefing._setRatio(staker, ratio, ratioType);

        // set countdown length
        Countdown._setLength(countdownLength);

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // update metadata
        Metadata._setVariableMetadata(variableMetadata);
    }

    function increaseStake(address funder, uint256 currentStake, uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // add stake
        Staking._addStake(_data.staker, funder, currentStake, amountToAdd);
    }

    function punish(address from, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // execute griefing
        cost = Griefing._grief(from, _data.staker, punishment, message);
    }

    function startCountdown() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // require countdown is not started
        require(Deadline.getDeadline() == 0, "deadline already set");

        // start countdown
        deadline = Countdown._start();
    }

    function retrieveStake(address recipient) public returns (uint256 amount) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or operator");

        // require deadline is passed
        require(Deadline.isAfterDeadline(),"deadline not passed");

        // retrieve stake
        amount = Staking._takeFullStake(_data.staker, recipient);
    }

    // view functions

    function isStaker(address caller) public view returns (bool validity) {
        validity = (caller == _data.staker);
    }

    function isCounterparty(address caller) public view returns (bool validity) {
        validity = (caller == _data.counterparty);
    }
}
