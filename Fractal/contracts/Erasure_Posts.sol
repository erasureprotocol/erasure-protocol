pragma solidity ^0.5.0;

import "./helpers/IPFSWrapper.sol";
import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract Erasure_Posts is IPFSWrapper {

    using SafeMath for uint256;

    Post[] private posts;

    address public nmr;

    struct Post {
        IPFSMultiHash[] hashes;
        address owner;
        bytes staticMetadata;
        bytes metadata;
    }

    event PostCreated(uint256 postID, address owner, bytes staticMetadata, bytes metadata);
    event PostUpdated(uint256 postID, address owner, bytes metadata);
    event HashSubmitted(uint256 postID, bytes proofHash);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // POSTS //

    function createPost(bytes memory proofHash, bytes memory staticMetadata, bytes memory metadata) public returns (uint256 postID) {

        postID = posts.length;
        posts.length++;

        posts[postID].owner = msg.sender;
        posts[postID].staticMetadata = staticMetadata;
        posts[postID].metadata = metadata;

        submitHash(postID, proofHash);

        emit PostCreated(postID, msg.sender, staticMetadata, metadata);
    }

    function submitHash(uint256 postID, bytes memory proofHash) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.hashes.push(splitIPFSHash(proofHash));

        emit HashSubmitted(postID, proofHash);
    }

    function updatePost(uint256 postID, bytes memory metadata) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.metadata = metadata;

        emit PostUpdated(postID, msg.sender, metadata);
    }

    function getPostOwner(uint256 postID) public view returns (address owner) {
        return posts[postID].owner;
    }

    function getPostMetadata(uint256 postID) public view returns (bytes memory metadata) {
        return posts[postID].metadata;
    }

}
