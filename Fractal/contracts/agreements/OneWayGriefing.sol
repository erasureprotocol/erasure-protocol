pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/Countdown.sol";
import "../modules/SimpleGriefing.sol";
import "../modules/Metadata.sol";

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
contract OneWayGriefing is Countdown, SimpleGriefing, Metadata {

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

        // set griefing params
        SimpleGriefing.setStake(staker, 0, ratio, punishType);

        // set countdown length
        Countdown.setLength(endDelay);

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // emit event
        emit Created(staker, counterparty, ratio, punishType, token, endDelay);
    }

    modifier onlyStaker(address caller) {
        require(caller == _data.staker, 'only staker');
        _;
    }

    modifier onlyCounterparty(address caller) {
        require(caller == _data.counterparty, 'only counterparty');
        _;
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public onlyStaker(msg.sender) {
        Metadata._setVariableMetadata(variableMetadata);
    }

    function increaseStake(uint256 currentStake, uint256 amountToAdd) public onlyStaker(msg.sender) {

        address caller = msg.sender;

        // get current stake amount
        (uint256 stake, uint256 ratio, SimpleGriefing.PunishType punishType) = SimpleGriefing.getStake(_data.staker);

        // calculate new sake amount
        uint256 newStake = stake.add(amountToAdd);

        // require current stake matches parameter to prevent front-running
        require(stake == currentStake, 'currentStake parameter does not match stake');

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // transfer amount
        require(IERC20(_data.token).transferFrom(caller, address(this), amountToAdd), "token transfer failed");

        // add amount to stake storage
        SimpleGriefing.setStake(_data.staker, newStake, ratio, punishType);
    }

    function punish(uint256 punishment, bytes memory message) public onlyCounterparty(msg.sender) returns (uint256 cost) {

        // require agreement is not ended
        require(!Countdown.isOver(), "agreement not ended");

        // execute griefing
        cost = SimpleGriefing.grief(msg.sender, _data.staker, punishment, message);
    }

    function setDeadline() public onlyStaker(msg.sender) returns (uint256 deadline) {

        // require countdown is not started
        require(Deadline.getDeadline() == 0, "deadline already set");

        // start countdown
        deadline = Countdown.start();
    }

    function retrieve() public onlyStaker(msg.sender) returns (uint256 amount) {

        // require deadline is passed
        require(Deadline.isAfterDeadline(),"deadline not passed");

        // retrieve stake
        amount = SimpleGriefing.retrieve(msg.sender, msg.sender);
    }
}
