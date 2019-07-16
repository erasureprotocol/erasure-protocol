pragma solidity ^0.5.0;

import "./posts/PostArray.sol";


contract Erasure_Posts {

    address[] public posts;

    event PostCreated(address post, address creator);

    function create(
        address token,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory metadata
    ) public returns (address post) {
        post = address(new PostArray(token, proofHash, staticMetadata, metadata));
        posts.push(post);
        emit PostCreated(post, msg.sender);
    }

}
