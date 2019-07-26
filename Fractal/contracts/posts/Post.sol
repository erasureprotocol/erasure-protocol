pragma solidity ^0.5.0;

import "../modules/MultiHashWrapper.sol";
import "../modules/Metadata.sol";


contract Post is MultiHashWrapper, Metadata {

    PostData private _post;
    struct PostData {
        MultiHash proofHash;
        address owner;
    }

    event Created(address owner, bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    constructor(bytes memory proofHash, bytes memory staticMetadata, bytes memory variableMetadata) public {

        // set storage variables
        _post.proofHash = MultiHashWrapper._splitMultiHash(proofHash);
        _post.owner = msg.sender;

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // set variable metadata
        Metadata._setVariableMetadata(variableMetadata);

        // emit event
        emit Created(msg.sender, proofHash, staticMetadata, variableMetadata);
    }

    modifier onlyOwner() {
        require(msg.sender == _post.owner, "only owner");
        _;
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public onlyOwner() {
        Metadata._setVariableMetadata(variableMetadata);
    }

    // view functions

    function getPostData() public view returns (bytes memory proofHash, address owner) {
        proofHash = MultiHashWrapper._combineMultiHash(_post.proofHash);
        owner = _post.owner;
    }

}
