pragma solidity ^0.5.0;

import "./Post_Factory.sol";
import "../modules/iRegistry.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";


contract Feed is Operated, Metadata {

    address[] private _posts;
    address private _postRegistry;

    event PostCreated(address post, address postFactory, bytes initData);

    function initialize(
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        uint32 codeSize;
        assembly { codeSize := extcodesize(address) }
        require(codeSize == 0, "must be called within contract constructor");

        // set operator
        Operated._setOperator(operator);
        Operated._activate();

        // set post registry
        _postRegistry = postRegistry;

        // set static metadata
        Metadata._setStaticMetadata(feedStaticMetadata);
    }

    // state functions

    function createPost(address postFactory, bytes memory initData) public returns (address post) {
        // only operator
        require(Operated.isOperator(msg.sender), "only operator");

        // validate factory is registered
        require(
            iRegistry(_postRegistry).getFactoryStatus(postFactory) == iRegistry.FactoryStatus.Registered,
            "Factory is not actively registered."
        );

        // spawn new post contract
        post = Post_Factory(postFactory).create(initData);

        // add to array of posts
        _posts.push(post);

        // emit event
        emit PostCreated(post, postFactory, initData);
    }

    function setFeedVariableMetadata(bytes memory feedVariableMetadata) public {
        // only operator
        require(Operated.isOperator(msg.sender), "only operator");

        Metadata._setVariableMetadata(feedVariableMetadata);
    }

    // view functions

    function getPosts() public view returns (address[] memory posts) {
        posts = _posts;
    }

}
