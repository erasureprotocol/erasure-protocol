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

    event ExplicitInitData(address operator, bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address operator,
            bytes memory proofHash,
            bytes memory staticMetadata,
            bytes memory variableMetadata
        ) = abi.decode(initdata, (address,bytes,bytes,bytes));

        // call explicit create
        instance = createExplicit(operator, proofHash, staticMetadata, variableMetadata);
    }

    function createExplicit(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public returns (address instance) {
        // declare template in memory
        Post template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,
            proofHash,
            staticMetadata,
            variableMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(operator, proofHash, staticMetadata, variableMetadata);
    }

}
