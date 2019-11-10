pragma solidity ^0.5.0;


/// @title EventMetadata
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract EventMetadata {

    event MetadataSet(bytes metadata);

    // state functions

    function _setMetadata(bytes memory metadata) internal {
        emit MetadataSet(metadata);
    }
}
