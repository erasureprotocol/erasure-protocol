pragma solidity ^0.5.0;

import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";
import "../modules/ProofHashes.sol";
import "../modules/MultiHashWrapper.sol";


/// @title Feed
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Feed is ProofHashes, MultiHashWrapper, Operated, EventMetadata, Template {

    event Initialized(address operator, bytes multihash, bytes metadata);

    function initialize(
        address operator,
        bytes memory multihash,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // add multihash to storage
        if (multihash.length != 0) {
            // unpack multihash
            MultiHashWrapper.MultiHash memory multihashObj = MultiHashWrapper._splitMultiHash(multihash);

            // set multihash format
            ProofHashes._setMultiHashFormat(multihashObj.hashFunction, multihashObj.digestSize);

            // submit hash
            ProofHashes._submitHash(multihashObj.hash);
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, multihash, metadata);
    }

    // state functions

    function submitHash(bytes32 multihash) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // add multihash to storage
        ProofHashes._submitHash(multihash);
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
