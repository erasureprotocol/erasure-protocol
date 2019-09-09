pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./MultiPartyGriefing.sol";


contract MultiPartyGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        MultiPartyGriefing template = new MultiPartyGriefing();
        address templateContract = address(template);
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

    event ExplicitInitData(address indexed operator, bool trustedOperator, uint256 griefDeadline, bytes metadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address operator,
            address token,
            bool trustedOperator,
            uint256 griefDeadline,
            bytes memory metadata
        ) = abi.decode(initdata, (address,address,bool,uint256,bytes));

        // call explicit create
        instance = createExplicit(operator, token, trustedOperator, griefDeadline, metadata);
    }

    function createExplicit(
        address operator,
        address token,
        bool trustedOperator,
        uint256 griefDeadline,
        bytes memory metadata
    ) public returns (address instance) {
        // declare template in memory
        MultiPartyGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,        // operator
            token,           // token
            trustedOperator, // trustedOperator
            griefDeadline,   // griefDeadline
            metadata         // metadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit events
        emit ExplicitInitData(operator, trustedOperator, griefDeadline, metadata);
    }

}
