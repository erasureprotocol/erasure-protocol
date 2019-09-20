pragma solidity ^0.5.0;

import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";
import "../modules/ProofHashes.sol";


contract Feed is ProofHashes, Operated, EventMetadata, Template {

    event Initialized(address operator, bytes proofHash, bytes metadata);

    function initialize(
        address operator,
        bytes memory proofHash,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // add proofHash to storage
        if (proofHash.length != 0) {
            ProofHashes._addProofHash(proofHash);
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, proofHash, metadata);
    }

    // state functions

    function submitProofHash(bytes memory proofHash) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // add proofHash to storage
        ProofHashes._addProofHash(proofHash);
    }

    function setMetadata(bytes memory metadata) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // set metadata
        EventMetadata._setMetadata(metadata);
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

}
