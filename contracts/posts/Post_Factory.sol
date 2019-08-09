pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Post.sol";


contract Post_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new Post());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initdataABI
        string memory initdataABI = '(bytes,bytes,bytes)';
        // set calldataABI
        string memory calldataABI = '(bytes4,address,bytes,bytes,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI, calldataABI);
    }

    event ExplicitInitData(bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function create(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            bytes memory proofHash,
            bytes memory staticMetadata,
            bytes memory variableMetadata
        ) = abi.decode(initdata, (bytes,bytes,bytes));

        // call explicit create
        instance = createExplicit(proofHash, staticMetadata, variableMetadata);
    }

    function createExplicit(
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public returns (address instance) {
        // declare template in memory
        Post template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            msg.sender,                   // operator
            proofHash,
            staticMetadata,
            variableMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(proofHash, staticMetadata, variableMetadata);
    }

}
