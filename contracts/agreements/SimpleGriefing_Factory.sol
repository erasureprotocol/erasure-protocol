pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./SimpleGriefing.sol";


/// @title SimpleGriefing_Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract SimpleGriefing_Factory is Factory {

    constructor(address instanceRegistry, address templateContract) public {
        SimpleGriefing template;
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
