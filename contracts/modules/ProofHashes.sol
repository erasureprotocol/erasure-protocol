pragma solidity ^0.5.0;


contract ProofHashes {

    event HashFormatSet(uint8 hashFunction, uint8 digestSize);
    event HashSubmitted(bytes32 hash);

    // state functions

    function _setMultiHashFormat(uint8 hashFunction, uint8 digestSize) internal {
        // emit event
        emit HashFormatSet(hashFunction, digestSize);
    }

    function _submitHash(bytes32 hash) internal {
        // emit event
        emit HashSubmitted(hash);
    }

}
