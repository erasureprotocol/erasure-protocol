pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./TestFeed.sol";


contract TestFeedFactory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        TestFeed template = new TestFeed();
        address templateContract = address(template);
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Post')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
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
            address postRegistry,
            bytes memory feedStaticMetadata
        ) = abi.decode(initdata, (address,address,bytes));

        // call explicit create
        instance = createExplicit(operator, postRegistry, feedStaticMetadata);
    }

    function createExplicit(
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public returns (address instance) {
        // declare template in memory
        Feed template;

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
