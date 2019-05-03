pragma solidity ^0.5.0;

import "./helpers/openzeppelin-eth/math/SafeMath.sol";
import "./helpers/openzeppelin-eth/token/ERC20/ERC20Burnable.sol";


contract PostRegistry {

    using SafeMath for uint256;

    Post[] public posts;

    address public nmr;

    struct Post {
        bytes32[] hashes;
        address owner;
        bytes metadata;
    }

    event PostCreated(uint256 postID, address owner, bytes metadata);
    event PostUpdated(uint256 postID, address owner, bytes metadata);
    event HashSubmitted(uint256 postID, bytes32 proofHash);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // POSTS //

    function createPost(bytes32 proofHash, bytes memory metadata) public returns (uint256 postID) {

        postID = posts.length;

        bytes32[] memory hashes;

        posts.push(Post(hashes, msg.sender, metadata));

        submitHash(postID, proofHash);

        emit PostCreated(postID, msg.sender, metadata);
    }

    function updatePost(uint256 postID, bytes memory metadata) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.metadata = metadata;

        emit PostUpdated(postID, msg.sender, metadata);
    }

    function submitHash(uint256 postID, bytes32 proofHash) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.hashes.push(proofHash);

        emit HashSubmitted(postID, proofHash);
    }

}
