pragma solidity ^0.5.0;

import "./agreements/MultiPartyGriefing.sol";
import "./agreements/OneSidedAgreement.sol";


contract MultiPartyGriefing_Factory {

    address[] public agreements;

    event AgreementCreated(address agreement, address creator);

    function create(
        address token,
        bool trustedCreator,
        uint256 griefDeadline,
        bytes memory metadata
    ) public returns (address agreement) {
        agreement = address(new MultiPartyGriefing(msg.sender, token, trustedCreator, griefDeadline, metadata));
        agreements.push(agreement);
        emit AgreementCreated(agreement, msg.sender);
    }
}

contract OneSidedAgreement_Factory {

}


contract Erasure_Agreements {

}
