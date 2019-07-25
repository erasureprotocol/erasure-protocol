pragma solidity ^0.5.0;


contract Erasure_Metadata {

    mapping (address => bytes) private _staticMetadata;
    mapping (address => bytes) private _variableMetadata;

    event StaticMetadataSet(address indexed user, bytes staticMetadata);
    event VariableMetadataSet(address indexed user, bytes variableMetadata);

    function setStaticMetadata(bytes memory staticMetadata) public {
        _staticMetadata[msg.sender] = staticMetadata;
        emit StaticMetadataSet(msg.sender, staticMetadata);
    }

    function setVariableMetadata(bytes memory variableMetadata) public {
        _variableMetadata[msg.sender] = variableMetadata;
        emit VariableMetadataSet(msg.sender, variableMetadata);
    }

    function getMetadata(address user) public view returns (bytes memory staticMetadata, bytes memory variableMetadata) {
        staticMetadata = _staticMetadata[user];
        variableMetadata = _variableMetadata[user];
    }
}

contract Metadata {

    address private _erasureMetadata;

    constructor(address erasureMetadata) internal {
        _erasureMetadata = erasureMetadata;
    }

    function setStaticMetadata(bytes memory staticMetadata) internal {
        Erasure_Metadata(_erasureMetadata).setStaticMetadata(staticMetadata);
    }

    function setVariableMetadata(bytes memory variableMetadata) internal {
        Erasure_Metadata(_erasureMetadata).setVariableMetadata(variableMetadata);
    }

    function getMetadata(address user) internal view returns (bytes memory staticMetadata, bytes memory variableMetadata) {
        (staticMetadata, variableMetadata) = Erasure_Metadata(_erasureMetadata).getMetadata(user);
    }
}
