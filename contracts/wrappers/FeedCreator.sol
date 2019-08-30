pragma solidity ^0.5.0;

import "../posts/Feed_Factory.sol";
import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";

contract FeedManager is Ownable {

    address private _feed;
    address private _feedFactory;
    address private _postFactory;

    constructor(address feedFactory, address postFactory) public {
        _feedFactory = feedFactory;
        _postFactory = postFactory;
    }

    function createFeed(
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public returns (address instance) {
        // declare template in memory
        Feed template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            operator,
            postRegistry,
            feedStaticMetadata
        );

        // deploy instance
        instance = Feed_Factory(_feedFactory).create(callData);

        // set instance in storage
        _feed = instance;
    }

    function createPost(address postFactory, bytes memory initData) public returns (address post) {
        post = Feed(_feed).createPost(postFactory, initData);
    }

    function createPostExplicit(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public returns (address post) {

        // construct the data payload used when initializing the new contract.
        bytes memory initData = abi.encode(
            operator,
            proofHash,
            staticMetadata,
            variableMetadata
        );

        // deploy instance
        post = Feed(_feed).createPost(_postFactory, initData);
    }

    function getFeed() public view returns (address feed) {
        feed = _feed;
    }
}
