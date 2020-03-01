pragma solidity 0.5.16;


/// @title EventMetadata
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module emits metadata blob as an event.
contract EventMetadata {

    event MetadataSet(bytes metadata);

    // state functions

    /// @notice Emit a metadata blob.
    /// @param metadata data blob of any format.
    function _setMetadata(bytes memory metadata) internal {
        emit MetadataSet(metadata);
    }
}
