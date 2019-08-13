pragma solidity ^0.5.0;

import "../posts/Post.sol";

contract TestPost is Post {

    address private _postContract;
    Post private _template;

    constructor(
        address postContract,
        bool validInit,
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public {
        _postContract = postContract;

        if (validInit) {
            initializePost(
                operator,
                proofHash,
                staticMetadata,
                variableMetadata
            );
        } else {
            invalidInitializePost(
                operator
            );
        }
    }

    function initializePost(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public {
        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector,
            operator,
            proofHash,
            staticMetadata,
            variableMetadata
        );
        (bool ok, bytes memory data) = _postContract.delegatecall(initData);
        require(ok, string(data));
    }

    function setProofHash(bytes memory proofHash) public {
        bytes memory oldProofHash = ProofHash.getProofHash();
        require(oldProofHash.length != 0, "same");
        ProofHash._setProofHash(proofHash);
    }

    // invalid initialize() call without variableMetadata in ABI encoding
    function invalidInitializePost(
        address operator
    ) private {
        bytes memory initData = abi.encodeWithSelector(
            _template.initialize.selector,
            operator
            // no proofHash
            // no staticMetadata
            // no variableMetadata
        );
        (bool ok, bytes memory data) = _postContract.delegatecall(initData);
        require(ok, string(data));
    }

    function setVariableMetadata(bytes memory variableMetadata) public {
        bytes memory callData = abi.encodeWithSelector(
            _template.setVariableMetadata.selector,
            variableMetadata
        );

        (bool ok, bytes memory data) = _postContract.delegatecall(callData);
        require(ok, string(data));
    }

    // backdoor function to deactivate Operator for testing
    function deactivateOperator() public {
        Operated._deactivateOperator();
    }
}
