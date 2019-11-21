pragma solidity ^0.5.0;

import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";
import "../modules/ProofHashes.sol";


/// @title Feed
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Feed is ProofHashes, Operated, EventMetadata, Template {

    event Initialized(address operator, bytes32 proofHash, bytes metadata);

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator Address of the operator that overrides access control
    /// @param proofHash Proofhash (bytes32) sha256 hash of timestampled data
    /// @param metadata Data (any format) to emit as event on initialization
    function initialize(
        address operator,
        bytes32 proofHash,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // submit proofHash
        if (proofHash != bytes32(0)) {
            ProofHashes._submitHash(proofHash);
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, proofHash, metadata);
    }

    // state functions

    /// @notice Submit proofhash to add to feed
    /// @dev Access Control: creator OR operator
    ///      State Machine: always
    /// @param proofHash Proofhash (bytes32) sha256 hash of timestampled data
    function submitHash(bytes32 proofHash) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // submit proofHash
        ProofHashes._submitHash(proofHash);
    }

    /// @notice Emit metadata event
    /// @dev Access Control: creator OR operator
    ///      State Machine: always
    /// @param metadata Data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // set metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Called by the operator to transfer control to new operator
    /// @dev Access Control: operator
    ///      State Machine: anytime
    /// @param operator Address of the new operator
    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    /// @notice Called by the operator to renounce control
    /// @dev Access Control: operator
    ///      State Machine: anytime
    function renounceOperator() public {
        // restrict access
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // renounce operator
        Operated._renounceOperator();
    }

}
