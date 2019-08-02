pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Post.sol";


contract Post_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new Post());

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));

        // set initABI
        string memory initABI = '(bytes4,bytes,bytes,bytes)';

        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initABI);
    }

    event ExplicitInitData(address operator,bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function createExplicit(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public returns (address instance) {
        // declare template in memory
        Post template;

        // construct the data payload used when initializing the new contract.
        bytes memory initData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,
            proofHash,
            staticMetadata,
            variableMetadata
        );

        // deploy instance
        instance = Factory.create(initData);

        // emit event
        emit ExplicitInitData(operator, proofHash, staticMetadata, variableMetadata);
    }

}
