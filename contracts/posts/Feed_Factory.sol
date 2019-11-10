pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Feed.sol";


/// @title Feed_Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Feed_Factory is Factory {

    constructor(address instanceRegistry, address templateContract) public {
        Feed template;

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
