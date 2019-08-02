pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./OneWayGriefing.sol";


contract OneWayGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new OneWayGriefing());

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));

        // set initABI
        string memory initABI = '(bytes4,address,address,address,address,uint256,Griefing.RatioType,uint256,bytes)';

        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initABI);
    }

    event ExplicitInitData(address indexed staker, address indexed counterparty, uint256 ratio, Griefing.RatioType ratioType, address token, uint256 countdownLength, bytes staticMetadata);

    function createExplicit(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public returns (address instance) {
        // declare template in memory
        OneWayGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory initData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            countdownLength, // countdownLength
            staticMetadata   // staticMetadata
        );

        // deploy instance
        instance = Factory.create(initData);

        // emit event
        emit ExplicitInitData(staker, counterparty, ratio, ratioType, token, countdownLength, staticMetadata);
    }

}
