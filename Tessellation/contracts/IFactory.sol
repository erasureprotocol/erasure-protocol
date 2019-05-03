pragma solidity ^0.5.0;


contract IFactory {

    function getPayloadSize() public returns (uint256 initPayloadSize, uint256 numSignatures);

    function intializeAgreement(bytes memory initPayload, bytes memory signatures) public returns (address agreement);

}
