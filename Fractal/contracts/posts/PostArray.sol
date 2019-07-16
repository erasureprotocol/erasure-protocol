pragma solidity ^0.5.0;

import "../helpers/IPFSWrapper.sol";
import "../helpers/openzeppelin-solidity/math/SafeMath.sol";


contract PostArray is IPFSWrapper {

    using SafeMath for uint256;

    Post public post;

    struct Post {
        IPFSMultiHash[] hashes;
        address token;
        address owner;
        bytes staticMetadata;
        bytes metadata;
    }

    event PostCreated(address owner, bytes staticMetadata, bytes metadata);
    event PostUpdated(address owner, bytes metadata);
    event HashSubmitted(bytes proofHash);

    constructor(address token, bytes memory proofHash, bytes memory staticMetadata, bytes memory metadata) public {
        post.token = token;
        post.owner = msg.sender;
        post.staticMetadata = staticMetadata;
        post.metadata = metadata;

        submitHash(proofHash);

        emit PostCreated(msg.sender, staticMetadata, metadata);
    }

    function submitHash(bytes memory proofHash) public {
        require(msg.sender == post.owner, "only owner");

        post.hashes.push(splitIPFSHash(proofHash));

        emit HashSubmitted(proofHash);
    }

    function updatePost(bytes memory metadata) public {
        require(msg.sender == post.owner, "only owner");

        post.metadata = metadata;

        emit PostUpdated(msg.sender, metadata);
    }

    function getPostOwner() public view returns (address owner) {
        return post.owner;
    }

    function getPostMetadata() public view returns (bytes memory metadata) {
        return post.metadata;
    }

}
