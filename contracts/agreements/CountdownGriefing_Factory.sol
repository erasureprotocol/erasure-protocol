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

}
