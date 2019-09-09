pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./CountdownGriefing.sol";


contract CountdownGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        CountdownGriefing template = new CountdownGriefing();
        address templateContract = address(template);
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createSalty(bytes memory callData, bytes32 salt) public returns (address instance) {
        // deploy instance
        instance = Factory._createSalty(callData, salt);
    }

}
