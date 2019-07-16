pragma solidity ^0.5.0;

import "../Erasure_Posts.sol";


/*
 * TODO: should it be possible to update the post factory?
 */
contract Feed {

    address[] public posts;

    Data public feed;

    struct Data {
        address owner;
        address postFactory;
    }

    constructor(address postFactory) public {
        feed.owner = msg.sender;
        feed.postFactory = postFactory;
    }

    function createPost(
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory metadata
    ) public returns (address post) {
        post = Erasure_Posts(feed.postFactory).create(proofHash, staticMetadata, metadata);
        posts.push(post);
    }

    function updateMetadata(address post, bytes memory metadata) public {
        Post(post).update(metadata);
    }

}
