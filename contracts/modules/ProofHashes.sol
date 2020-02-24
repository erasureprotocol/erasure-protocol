pragma solidity 0.5.16;


/// @title ProofHashes
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
contract ProofHashes {

    event HashSubmitted(bytes32 hash);

    // state functions

    function _submitHash(bytes32 hash) internal {
        // emit event
        emit HashSubmitted(hash);
    }

}
