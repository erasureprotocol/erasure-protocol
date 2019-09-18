pragma solidity ^0.5.0;

import "./Post_Factory.sol";
import "../modules/iRegistry.sol";
import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";


contract Feed is Operated, EventMetadata, Template {

    address[] private _posts;

    event Initialized(address operator, bytes metadata);
    event PostCreated(address post, address postFactory, bytes callData);

    function initialize(
        address operator,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, metadata);
    }

    // state functions

    function createPost(address postFactory, bytes memory callData) public returns (address post) {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // validate factory is registered
        require(
            iRegistry(iFactory(Template.getFactory()).getInstanceRegistry()).getFactoryStatus(postFactory) == iRegistry.FactoryStatus.Registered,
            "factory is not actively registered"
        );

        // spawn new post contract
        post = Post_Factory(postFactory).create(callData);

        // add to array of posts
        _posts.push(post);

        // emit event
        emit PostCreated(post, postFactory, callData);
    }

    function setMetadata(bytes memory metadata) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        EventMetadata._setMetadata(metadata);
    }

    function setPostMetadata(address post, bytes memory postMetadata) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        Post(post).setMetadata(postMetadata);
    }

    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    function renounceOperator() public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._renounceOperator();
    }

    // view functions

    function getPosts() public view returns (address[] memory posts) {
        posts = _posts;
    }

}
