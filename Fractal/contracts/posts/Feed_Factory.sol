pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./Feed.sol";


contract Feed_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new Feed());

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Feed')));

        // set initABI
        string memory initABI = '(bytes4,address,address,bytes)';

        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initABI);
    }

    event ExplicitInitData(address operator, address postRegistry, bytes feedStaticMetadata);

    function createExplicit(
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public returns (address instance) {
        // declare template in memory
        Feed template;

        // construct the data payload used when initializing the new contract.
        bytes memory initData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,
            postRegistry,
            feedStaticMetadata
        );

        // deploy instance
        instance = Factory.create(initData);

        // emit event
        emit ExplicitInitData(operator, postRegistry, feedStaticMetadata);
    }

}
