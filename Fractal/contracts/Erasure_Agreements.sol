pragma solidity ^0.5.0;

import "eip1167-spawner/contracts/Spawner.sol";
import "./agreements/MultiPartyGriefing.sol";
import "./agreements/OneWayGriefing.sol";


contract MultiPartyGriefing_Factory is Spawner {

    address logicContract; // NOTE: deploy first & use constant to save ~200 gas/create
    address[] private _agreements;

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
        _agreements.push(agreement);
        emit AgreementCreated(agreement, msg.sender);
    }

    function countAgreements() external view returns (uint256) {
        return _agreements.length;
    }

    function getAgreement(uint256 index) external view returns (address) {
        require(index < _agreements.length, "index out of range");

        return _agreements[index];
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getAgreements(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (address[] memory) {
        require(startIndex < endIndex, "startIndex must be less than endIndex");
        require(endIndex <= _agreements.length, "end index out of range");
        
        address[] memory range = new address[](endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            range[i - startIndex] = _agreements[i];
        }

        return range;
    }
}

contract OneWayGriefing_Factory {

}


contract Erasure_Agreements {

}
