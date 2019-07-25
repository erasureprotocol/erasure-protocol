pragma solidity ^0.5.0;

import "../Erasure_Posts.sol";
import "../modules/Metadata.sol";


/*
 * TODO: should it be possible to update the post factory?
 */
contract Feed is Metadata {

    address[] private _posts;

    FeedData private _feed;
    struct FeedData {
        address owner;
        address postFactory;
    }

    event PostCreated(address post);

    constructor(address postFactory, bytes memory feedStaticMetadata) public {

        // set storage variables
        _feed.owner = msg.sender;
        _feed.postFactory = postFactory;

        // set static metadata
        Metadata._setStaticMetadata(feedStaticMetadata);
    }

    modifier onlyOwner() {
        require(msg.sender == _feed.owner, "only owner");
        _;
    }

    // state functions

    function createPost(
        bytes memory proofHash,
        bytes memory postStaticMetadata,
        bytes memory postVariableMetadata
    ) public returns (address post) {

        // spawn new post contract
        post = Erasure_Posts(_feed.postFactory).create(proofHash, postStaticMetadata, postVariableMetadata);

        // add to array of posts
        _posts.push(post);

        // emit event
        emit PostCreated(post);
    }

    function setPostVariableMetadata(address post, bytes memory postVariableMetadata) public onlyOwner() {
        Post(post).setVariableMetadata(postVariableMetadata);
    }

    function setFeedVariableMetadata(bytes memory feedVariableMetadata) public onlyOwner() {
        Metadata._setVariableMetadata(feedVariableMetadata);
    }

    // view functions

    function getFeedData() public view returns (address owner, address postFactory) {
        owner = _feed.owner;
        postFactory = _feed.postFactory;
    }

    function getPosts() public view returns (address[] memory posts) {
        posts = _posts;
    }

}
