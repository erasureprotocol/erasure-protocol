pragma solidity ^0.5.0;

import "../agreements/CountdownGriefing.sol";

contract TestCountdownGriefing is CountdownGriefing {
    CountdownGriefing private _template;
    address private _griefingContract;

    uint256 private _griefCost;
    uint256 private _deadline;
    uint256 private _retrieveStakeAmount;

    constructor(
        address griefingContract,
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata) public {

        initializeCountdownGriefing(
            griefingContract,
            token,
            operator,
            staker,
            counterparty,
            ratio,
            ratioType,
            countdownLength,
            staticMetadata
        );
    }

    function initializeCountdownGriefing(
        address griefingContract,
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public {
        _griefingContract = griefingContract;

        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            countdownLength, // countdownLength
            staticMetadata   // staticMetadata
        );

        (bool ok, bytes memory data) = _griefingContract.delegatecall(initData);
        require(ok, string(data));
  }

    function setVariableMetadata(bytes memory variableMetadata) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.setVariableMetadata.selector,
            variableMetadata
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
    }

    function increaseStake(uint256 currentStake, uint256 amountToAdd) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.increaseStake.selector,
            currentStake, amountToAdd
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
    }

    function reward(uint256 currentStake, uint256 amountToAdd) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.reward.selector,
            currentStake, amountToAdd
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
    }

    function startCountdown() public returns (uint256 deadline) {
        bytes memory callData = abi.encodeWithSelector(_template.startCountdown.selector);

        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        deadline = abi.decode(data, (uint256));
        _deadline = deadline;
    }

    function punish(address from, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        bytes memory callData = abi.encodeWithSelector(
            _template.punish.selector,
            from, punishment, message
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        cost = abi.decode(data, (uint256));
        _griefCost = cost;
    }

    function retrieveStake(address recipient) public returns (uint256 amount) {
        bytes memory callData = abi.encodeWithSelector(
            _template.retrieveStake.selector,
            recipient
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        amount = abi.decode(data, (uint256));
        _retrieveStakeAmount = amount;
    }

    // backdoor function to activate Operator for testing
    function activateOperator() public {
        Operated._activateOperator();
    }

    // backdoor function to deactivate Operator for testing
    function deactivateOperator() public {
        Operated._deactivateOperator();
    }

    // view functions

    function getDeadline() public view returns(uint256 deadline) {
        deadline = _deadline;
    }

    function getGriefCost() public view returns(uint256 cost) {
        cost = _griefCost;
    }

    function getRetrieveStakeAmount() public view returns(uint256 retrieveStakeAmount) {
        retrieveStakeAmount = _retrieveStakeAmount;
    }
}
