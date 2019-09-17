pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Post.sol";


contract Post_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        Post template = new Post();
        address templateContract = address(template);
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
