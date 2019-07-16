pragma solidity ^0.5.0;

import "./posts/Post.sol";


contract Erasure_Posts {

    address[] public posts;

    event PostCreated(address post, address creator);

    function create(
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory metadata
    ) public returns (address post) {
        post = address(new Post(proofHash, staticMetadata, metadata));
        posts.push(post);
        emit PostCreated(post, msg.sender);
    }

}
