pragma solidity ^0.5.0;

import "../agreements/SimpleGriefing.sol";

contract TestSimpleGriefing is SimpleGriefing {
    SimpleGriefing private _template;
    address private _griefingContract;

    uint256 private _griefCost;
    uint256 private _deadline;
    uint256 private _releaseStakeAmount;

    constructor(
        address griefingContract,
        address token,
        address operator,
        address stakerA,
        address stakerB,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        bytes memory staticMetadata) public {

        initializeSimpleGriefing(
            griefingContract,
            token,
            operator,
            stakerA,
            stakerB,
            stakeDataA,
            stakeDataB,
            staticMetadata
        );
    }

    function initializeSimpleGriefing(
        address griefingContract,
        address token,
        address operator,
        address stakerA,
        address stakerB,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        bytes memory staticMetadata
    ) public {
        _griefingContract = griefingContract;

        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            stakerA,
            stakerB,
            stakeDataA,
            stakeDataB,
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

    function increaseStake(address staker, uint256 currentStake, uint256 amountToAdd) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.increaseStake.selector,
            staker, currentStake, amountToAdd
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
    }

    function reward(address staker, uint256 currentStake, uint256 amountToAdd) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.reward.selector,
            staker, currentStake, amountToAdd
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
    }

    function punish(address target, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        bytes memory callData = abi.encodeWithSelector(
            _template.punish.selector,
            target, punishment, message
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        cost = abi.decode(data, (uint256));
        _griefCost = cost;
    }

    function releaseStake(address staker) public returns (uint256 amount) {
        bytes memory callData = abi.encodeWithSelector(
            _template.releaseStake.selector,
            staker
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        amount = abi.decode(data, (uint256));
        _releaseStakeAmount = amount;
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
    function getGriefCost() public view returns(uint256 cost) {
        cost = _griefCost;
    }

    function getReleaseStakeAmount() public view returns(uint256 releaseStakeAmount) {
        releaseStakeAmount = _releaseStakeAmount;
    }
}
