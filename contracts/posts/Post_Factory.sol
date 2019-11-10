pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Post.sol";


/// @title Post_Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Post_Factory is Factory {

    constructor(address instanceRegistry, address templateContract) public {
        // declare template in memory
        Post template;

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
