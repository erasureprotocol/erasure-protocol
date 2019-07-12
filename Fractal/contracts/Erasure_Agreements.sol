pragma solidity ^0.5.0;

import "./agreements/MultiPartyGriefing.sol";


contract Erasure_Agreements {

    using SafeMath for uint256;

    address[] public agreements;

    function createAgreement(address _token, uint256 _griefDeadline, bytes memory _metadata) public returns (address agreement) {
        agreement = address(new MultiPartyGriefing(_token, msg.sender, _griefDeadline, _metadata));
        agreements.push(agreement);
    }

}
