pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Countdown.sol";
import "../modules/Griefing.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";

/* Immediately engage with specific buyer
 * - Stake can be increased at any time.
 * - Request to end agreement and recover stake requires cooldown period to complete.
 * - Counterparty can greif the staker at predefined ratio.
 *
 * NOTE:
 * - This top level contract should only perform access control and state transitions
 *
 */
contract CountdownGriefing is Countdown, Griefing, Metadata, Operated, Template {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address staker;
        address counterparty;
    }

    event Initialized(address token, address operator, address staker, address counterparty, uint256 ratio, Griefing.RatioType ratioType, uint256 countdownLength, bytes staticMetadata);

    constructor(address token) public {
        // set token used for staking
        Staking._setToken(token);
    }

    function initialize(
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public initializeTemplate() {
        // set storage values
        _data.staker = staker;
        _data.counterparty = counterparty;

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set griefing ratio
        Griefing._setRatio(staker, ratio, ratioType);

        // set countdown length
        Countdown._setLength(countdownLength);

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // log initialization params
        emit Initialized(token, operator, staker, counterparty, ratio, ratioType, countdownLength, staticMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // update metadata
        Metadata._setVariableMetadata(variableMetadata);
    }

    function increaseStake(uint256 currentStake, uint256 amountToAdd) public {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement ended");

        // add stake
        Staking._addStake(_data.staker, msg.sender, currentStake, amountToAdd);
    }

    function reward(uint256 currentStake, uint256 amountToAdd) public {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement ended");

        // add stake
        Staking._addStake(_data.staker, msg.sender, currentStake, amountToAdd);
    }

    function punish(uint256 currentStake, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        // restrict access
        require(isCounterparty(msg.sender) || Operated.isActiveOperator(msg.sender), "only counterparty or active operator");

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement ended");

        // execute griefing
        cost = Griefing._grief(msg.sender, _data.staker, currentStake, punishment, message);
    }

    function startCountdown() public returns (uint256 deadline) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require countdown is not started
        require(Deadline.getDeadline() == 0, "deadline already set");

        // start countdown
        deadline = Countdown._start();
    }

    function retrieveStake(address recipient) public returns (uint256 amount) {
        // restrict access
        require(isStaker(msg.sender) || Operated.isActiveOperator(msg.sender), "only staker or active operator");

        // require deadline is passed
        require(Deadline.isAfterDeadline(),"deadline not passed");

        // retrieve stake
        amount = Staking._takeFullStake(_data.staker, recipient);
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

    function isStaker(address caller) public view returns (bool validity) {
        validity = (caller == _data.staker);
    }

    function isCounterparty(address caller) public view returns (bool validity) {
        validity = (caller == _data.counterparty);
    }
}
