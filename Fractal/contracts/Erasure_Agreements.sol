pragma solidity ^0.5.0;

import "eip1167-spawner/contracts/Spawner.sol";
import "./agreements/MultiPartyGriefing.sol";
import "./agreements/OneWayGriefing.sol";


contract MultiPartyGriefing_Factory is Spawner {

    address logicContract; // NOTE: deploy first & use constant to save ~200 gas/create
    address[] public agreements;

    event AgreementCreated(address agreement, address creator);

    constructor() public {
        // deploy logic contract - skip initialization (cannot directly access)
        logicContract = address(new MultiPartyGriefing());
    }

    function create(
        address token,
        bool trustedCreator,
        uint256 griefDeadline,
        bytes memory metadata
    ) public returns (address agreement) {
        // construct the data payload used when initializing the new contract.
        bytes memory initializationCalldata = abi.encodeWithSelector(
            MultiPartyGriefing(logicContract).initialize.selector,
            msg.sender, // operator
            token,
            trustedCreator, // trustedOperator
            griefDeadline,
            metadata
        );

        // deploy new contract: initialize it & write minimal proxy to runtime.
        agreement = _spawn(logicContract, initializationCalldata);

        // add the agreement to the array and emit an event.
        agreements.push(agreement);
        emit AgreementCreated(agreement, msg.sender);
    }
}

contract OneWayGriefing_Factory {

}


contract Erasure_Agreements {

}
