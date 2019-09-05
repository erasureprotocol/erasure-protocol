pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Feed.sol";


contract Feed_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new Feed());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initdataABI
        string memory initdataABI = '(address,address,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(address operator, address postRegistry, bytes feedStaticMetadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address operator,
            bytes memory feedStaticMetadata
        ) = abi.decode(initdata, (address,bytes));

        // call explicit create
        instance = createExplicit(operator, feedStaticMetadata);
    }

    function createExplicit(
        address operator,
        bytes memory feedStaticMetadata
    ) public returns (address instance) {
        // declare template in memory
        Feed template;

        address postRegistry = Factory.getInstanceRegistry();

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,
            postRegistry,
            feedStaticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(operator, postRegistry, feedStaticMetadata);
    }

}
