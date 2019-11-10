pragma solidity ^0.5.0;

import "./MultiHashWrapper.sol";


/// @title ProofHash
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract ProofHash is MultiHashWrapper {

    MultiHash private _proofHash;

    event ProofHashSet(address caller, bytes proofHash);

    // state functions

    function _setProofHash(bytes memory proofHash) internal {
        _proofHash = MultiHashWrapper._splitMultiHash(proofHash);
        emit ProofHashSet(msg.sender, proofHash);
    }

    // view functions

    function getProofHash() public view returns (bytes memory proofHash) {
        proofHash = MultiHashWrapper._combineMultiHash(_proofHash);
    }

}
