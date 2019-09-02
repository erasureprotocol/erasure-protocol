pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";


interface IFeed_Factory {
    function createExplicit(address operator, address postRegistry, bytes calldata feedStaticMetadata) external returns (address instance);
    function createPost(address postFactory, bytes calldata initData) external returns (address post);
}

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

        // deploy instance
        instance = IFeed_Factory(_feedFactory).createExplicit(
            operator,
            postRegistry,
            feedStaticMetadata
        );

        // set instance in storage
        _feed = instance;
    }

    function createPost(address postFactory, bytes memory initData) public returns (address post) {
        post = IFeed_Factory(_feed).createPost(postFactory, initData);
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
        post = IFeed_Factory(_feed).createPost(_postFactory, initData);
    }

    function getFeed() public view returns (address feed) {
        feed = _feed;
    }
}
