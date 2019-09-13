pragma solidity ^0.5.0;

import "../agreements/SimpleGriefing.sol";

contract TestSimpleGriefing is SimpleGriefing {
    SimpleGriefing private _template;
    address private _griefingContract;

    uint256 private _griefCost;
    uint256 private _deadline;

    constructor(
        address griefingContract,
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        bytes memory metadata) public {

        initializeSimpleGriefing(
            griefingContract,
            operator,
            staker,
            counterparty,
            ratio,
            ratioType,
            metadata
        );
    }

    function initializeSimpleGriefing(
        address griefingContract,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        bytes memory metadata
    ) public {
        _griefingContract = griefingContract;

        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector, // selector
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            metadata   // metadata
        );

        (bool ok, bytes memory data) = _griefingContract.delegatecall(initData);
        require(ok, string(data));
  }

    function setMetadata(bytes memory metadata) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.setMetadata.selector,
            metadata
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

    function punish(uint256 currentStake, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        bytes memory callData = abi.encodeWithSelector(
            _template.punish.selector,
            currentStake, punishment, message
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
        cost = abi.decode(data, (uint256));
        _griefCost = cost;
    }

    function releaseStake(uint256 currentStake, uint256 amountToRelease) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.releaseStake.selector,
            currentStake, amountToRelease
        );
        (bool ok, bytes memory data) = _griefingContract.delegatecall(callData);
        require(ok, string(data));
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
}
