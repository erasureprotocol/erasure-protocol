pragma solidity ^0.5.0;

import "../helpers/MultiHashWrapper.sol";


contract Post is MultiHashWrapper {

    Data private post;

    struct Data {
        MultiHash proofHash;
        address owner;
        bytes staticMetadata;
        bytes metadata;
    }

    event Created(address owner, bytes proofHash, bytes staticMetadata, bytes metadata);
    event Updated(bytes metadata);

    constructor(bytes memory proofHash, bytes memory staticMetadata, bytes memory metadata) public {
        post.proofHash = splitMultiHash(proofHash);
        post.owner = msg.sender;
        post.staticMetadata = staticMetadata;
        post.metadata = metadata;
        emit Created(msg.sender, proofHash, staticMetadata, metadata);
    }

    function update(bytes memory metadata) public {
        require(msg.sender == post.owner, "only owner");
        post.metadata = metadata;
        emit Updated(metadata);
    }

    function getOwner() public view returns (address owner) {
        return post.owner;
    }

    function getMetadata() public view returns (bytes memory metadata) {
        return post.metadata;
    }

}
