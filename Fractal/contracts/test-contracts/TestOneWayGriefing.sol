pragma solidity ^0.5.0;

import "../agreements/OneWayGriefing.sol";

contract TestOneWayGriefing is OneWayGriefing {
    OneWayGriefing private _template;
    address private _griefingContract;

    uint256 private _griefCost;

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
        
        initializeOneWayGriefing(
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

    function delegateCallToOneWayGriefing(bytes memory callData) internal {
        // delegatecall returns the revert bool and reason
        // surface the revert reason to tests
        (bool revertStatus, bytes memory revertReason) = _griefingContract.delegatecall(callData);
        require(revertStatus, string(revertReason));
    }

    function initializeOneWayGriefing(
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

        delegateCallToOneWayGriefing(initData);
  }

    function setVariableMetadata(bytes memory variableMetadata) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.setVariableMetadata.selector,
            variableMetadata
        );
        delegateCallToOneWayGriefing(callData);
    }

    function increaseStake(address funder, uint256 currentStake, uint256 amountToAdd) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.increaseStake.selector,
            funder, currentStake, amountToAdd
        );
        delegateCallToOneWayGriefing(callData);
    }

    function punish(address from, uint256 punishment, bytes memory message) public returns (uint256 cost) {
        bytes memory callData = abi.encodeWithSelector(
            _template.punish.selector,
            from, punishment, message
        );
        // delegateCallToOneWayGriefing(callData);

        assembly {
            let returnSize := 32
            mstore(0x40, callData)

            calldatacopy(0xff, 0, calldatasize)
            let _retVal := delegatecall(gas, address, 0x40, calldatasize, 0, returnSize)
            switch _retVal case 0 { revert(0,0) } default {
                let griefCost := mload(0)
                sstore("_griefCost", griefCost)
                return(0, returnSize)
            }
        }
    }
}
