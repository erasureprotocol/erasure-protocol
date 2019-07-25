pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract Operated {

    address private _operator;

    modifier onlyOperator() {
        require(msg.sender == getOperator(), "only operator");
        _;
    }

    constructor() internal {
        _operator = msg.sender;
    }

    function getOperator() internal view returns (address operator) {
        operator = _operator;
    }

}

/* Deadline
 *
 * TODO:
 * - Review if isAfterDeadline() behaves correctly when _deadline not set
 */
contract Deadline {

    uint256 private _deadline;

    event DeadlineSet(uint256 deadline);

    // state functions

    function setDeadline(uint256 deadline) internal {
        _deadline = deadline;
        emit DeadlineSet(deadline);
    }

    // view functions

    function getDeadline() internal view returns (uint256 deadline) {
        deadline = _deadline;
    }

    function isAfterDeadline() internal view returns (bool status) {
        status = (now >= _deadline);
    }

    // modifiers

    modifier onlyAfterDeadline() {
        require(isAfterDeadline(), 'only after deadline');
        _;
    }

    modifier onlyBeforeDeadline() {
        require(!isAfterDeadline(), 'only before deadline');
        _;
    }

}

/* Countdown timer
 *
 * TODO:
 * - Review if timeRemaining() and isOver() behave correctly when length not set or countdown not started
 */
contract Countdown is Deadline {

    using SafeMath for uint256;

    uint256 private _length;

    event LengthSet(uint256 length);

    // state functions

    function setLength(uint256 length) internal {
        _length = length;
        emit LengthSet(length);
    }

    function start() internal returns (uint256 deadline) {
        require(_length != 0, 'length not set');
        deadline = _length.add(now);
        Deadline.setDeadline(deadline);
    }

    // view functions

    function getLength() internal view returns (uint256 length) {
        length = _length;
    }

    function isOver() internal view returns (bool status) {
        status = Deadline.isAfterDeadline();
    }

    function timeRemaining() internal view returns (uint256 time) {
        time = Deadline.getDeadline().sub(now);
    }

    // modifiers

    modifier onlyEndedCountdown() {
        require(isOver(), 'only ended countdown');
        _;
    }

    modifier onlyActiveCountdown() {
        require(timeRemaining() > 0, 'only active countdown');
        _;
    }

}


contract Parties {

    mapping (address => bytes) private _data;

    function setData(address party, bytes memory data) internal {
        _data[party] = data;
    }

    function getData(address party) internal view returns (bytes memory data) {
        data = _data[party];
    }

}

contract SimpleGriefing is Parties {

    using SafeMath for uint256;

    /* mapping (address => Data) internal parties;

    struct Data {
        uint256 stake;
        uint256 ratio;
        uint256 duration;
        LockType punishType;
    } */

    enum PunishType { CgtP, CltP, CeqP, Inf, NaN }

    Parameters private params;
    struct Parameters {
        address token;
    }

    event StakeUpdated(address party, uint256 stake, uint256 ratio, PunishType punishType);
    event StakePunished(uint256 punishment, uint256 cost, bytes message);
    event StakeRetrieved(address party, address recipient, uint256 amount);

    function getDataStoreHash() internal pure returns (bytes32 hash) {
        hash = keccak256('SimpleGriefing');
    }

    function getStake(address party) internal view returns (uint256 stake, uint256 ratio, PunishType punishType) {
        (stake, ratio, punishType) = abi.decode(Parties.getData(party), (uint256, uint256, PunishType));
    }

    function setStake(address party, uint256 stake, uint256 ratio, PunishType punishType) internal {
        Parties.setData(party, abi.encode(stake, ratio, punishType));
        emit StakeUpdated(party, stake, ratio, punishType);
    }

    function getCost(uint256 ratio, uint256 punishment, PunishType punishType) internal pure returns(uint256 cost) {
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

    function getPunishment(uint256 ratio, uint256 cost, PunishType punishType) internal pure returns(uint256 punishment) {
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

    function grief(address from, address target, uint256 punishment, bytes memory message) internal returns (uint256 cost) {
        (uint256 stake, uint256 ratio, PunishType punishType) = getStake(target);
        cost = getCost(ratio, punishment, punishType);

        ERC20Burnable(params.token).burn(punishment);
        ERC20Burnable(params.token).burnFrom(from, cost);

        setStake(target, stake.sub(punishment), ratio, punishType);

        emit StakePunished(punishment, cost, message);
    }

    function retrieve(address party, address recipient) internal returns (uint256 stake) {
        (uint256 currentStake, uint256 ratio, PunishType punishType) = getStake(party);

        stake = currentStake;

        require(stake > 0, "no stake to recover");
        setStake(party, 0, ratio, punishType);

        require(IERC20(params.token).transfer(recipient, stake), "token transfer failed");

        emit StakeRetrieved(party, recipient, stake);
    }

}

/* Immediately engage with specific buyer
 * - Stake can be increased at any time
 * - Agreement is defined at the user level.
 * - Request to end agreement and recover stake takes 40 days to complete.
 * - No escrow of funds required.
 * - Buyer has Inf griefing.
 * - Payments are separate.
 *
 * TODO:
 * - Should it be possible to update metadata?
 * - Validate if state machine works as expected in edge cases
 * - Review if should use parties contract separate from griefing contract
 */
contract OneSidedAgreement is Countdown, Parties, SimpleGriefing {

    using SafeMath for uint256;

    Data private _data;
    struct Data {
        address token;
        address staker;
        address counterparty;
    }

    event Created(address indexed staker, address indexed counterparty, uint256 ratio, SimpleGriefing.PunishType punishType, address token, uint256 endDelay);

    constructor(address token, address staker, address counterparty, uint256 ratio, SimpleGriefing.PunishType punishType, uint256 endDelay) public {

        _data.token = token;
        _data.staker = staker;
        _data.counterparty = counterparty;

        // set griefing params
        SimpleGriefing.setStake(staker, 0, ratio, punishType);

        // set countdown length
        Countdown.setLength(endDelay);

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
