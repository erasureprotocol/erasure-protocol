pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Feed.sol";


contract Feed_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new Feed());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Feed')));
        // set initdataABI
        string memory initdataABI = '(address,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(address postRegistry, bytes feedStaticMetadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address postRegistry,
            bytes memory feedStaticMetadata
        ) = abi.decode(initdata, (address,bytes));

        // call explicit create
        instance = createExplicit(postRegistry, feedStaticMetadata);
    }

    function createExplicit(
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public returns (address instance) {
        // declare template in memory
        Feed template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            msg.sender,
            postRegistry,
            feedStaticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(postRegistry, feedStaticMetadata);
    }

}
