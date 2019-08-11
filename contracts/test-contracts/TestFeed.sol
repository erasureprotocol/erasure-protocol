pragma solidity ^0.5.0;

import "../posts/Feed.sol";

contract TestFeed is Feed {
    Feed private _template;
    address private _feedContract;

    constructor(
        address feedContract,
        bool validInit,
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public {
        _feedContract = feedContract;

        if (validInit) {
            initializeFeed(
                operator,
                postRegistry,
                feedStaticMetadata
            );
        } else {
            invalidInitializeFeed(
                operator
            );
        }
    }

    function initializeFeed(
        address operator,
        address postRegistry,
        bytes memory feedStaticMetadata
    ) public {
        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector,
            operator,
            postRegistry,
            feedStaticMetadata
        );
        (bool ok, bytes memory data) = _feedContract.delegatecall(initData);
        require(ok, string(data));
    }

    function invalidInitializeFeed(
        address operator
    ) public {
        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector,
            operator
        );
        (bool ok, bytes memory data) = _feedContract.delegatecall(initData);
        require(ok, string(data));
    }

    function createPost(address postFactory, bytes memory initData) public returns (address post) {
        bytes memory callData = abi.encodeWithSelector(
            _template.createPost.selector,
            postFactory,
            initData
        );
        (bool ok, bytes memory data) = _feedContract.delegatecall(callData);
        require(ok, string(data));

        post = abi.decode(data, (address));
    }

    function setFeedVariableMetadata(bytes memory feedVariableMetadata) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.setFeedVariableMetadata.selector,
            feedVariableMetadata
        );
        (bool ok, bytes memory data) = _feedContract.delegatecall(callData);
        require(ok, string(data));
    }

    // backdoor function to deactivate Operator for testing
    function deactivateOperator() public {
        Operated._deactivate();
    }

    // backdoor function to activate Operator for testing
    function activateOperator() public {
        Operated._activate();
    }
}
