pragma solidity ^0.5.0;

import "../posts/Feed_Factory.sol";
import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";

contract FeedManager is Ownable {

    address private _feed;

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
        instance = Factory.create(callData);

        // set instance in storage
        _feed = instance
    }

    function createPost(address postFactory, bytes memory initData) public returns (address post) {
        post = Feed(feed).createPost(postFactory, initData);
    }

    function getFeed() public returns (address feed) {
        feed = _feed;
    }
}
