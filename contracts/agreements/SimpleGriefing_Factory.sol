pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./SimpleGriefing.sol";


contract SimpleGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new SimpleGriefing());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initdataABI
        string memory initdataABI = '(address,address,address,address,uint256,uint8,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(
        address indexed staker,
        address indexed counterparty,
        address indexed operator,
        uint256 ratio,
        Griefing.RatioType ratioType,
        bytes staticMetadata
    );

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createWithSalt(bytes memory callData, bytes32 salt) public returns (address instance) {
        // deploy instance
        instance = Factory._createWithSalt(callData, salt);
    }

    function createExplicit(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType, // uint8
        bytes memory staticMetadata
    ) public returns (address instance) {
        // declare template in memory
        SimpleGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            staticMetadata   // staticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(staker, counterparty, operator, ratio, ratioType, staticMetadata);
    }

    function createExplicitWithSalt(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType, // uint8
        bytes memory staticMetadata,
        bytes32 salt
    ) public returns (address instance) {
        // declare template in memory
        SimpleGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            staticMetadata   // staticMetadata
        );

        // deploy instance
        instance = Factory._createWithSalt(callData, salt);

        // emit event
        emit ExplicitInitData(staker, counterparty, operator, ratio, ratioType, staticMetadata);
    }

}
