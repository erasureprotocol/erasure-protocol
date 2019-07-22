pragma solidity ^0.5.0;


contract IFactory {

    /* function getPayloadSize() external returns (uint256 payloadSize, uint256 numSignatures); */

    function createInstance(address token, bytes calldata initData) external returns (address instance);

    function getMetadata() external returns (bytes memory metadata);

}
