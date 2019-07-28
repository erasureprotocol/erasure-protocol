pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./MultiPartyGriefing.sol";


contract MultiPartyGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new MultiPartyGriefing());

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));

        // set initABI
        string memory initABI = '(bytes4,address,address,bool,uint256,bytes)';

        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initABI);
    }

    event ExplicitInitData(address indexed operator, bool trustedOperator, uint256 griefDeadline, address token, bytes metadata);

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
        bytes memory initData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,        // operator
            token,           // token
            trustedOperator, // trustedOperator
            griefDeadline,   // griefDeadline
            metadata         // metadata
        );

        // deploy instance
        instance = Factory.create(initData);

        // emit events
        emit ExplicitInitData(operator, trustedOperator, griefDeadline, token, metadata);
    }

}
