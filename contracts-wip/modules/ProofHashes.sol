pragma solidity ^0.5.0;

import "./MultiHashWrapper.sol";


contract ProofHashesArray is MultiHashWrapper {

    MultiHash[] private _proofHashes;

    event ProofHashAdded(address caller, bytes proofHash, uint256 index);

    // state functions

    function _addProofHash(bytes memory proofHash) internal {
        // get last index
        uint256 index = _proofHashes.length;

        // push new hash to array
        _proofHashes.push(MultiHashWrapper._splitMultiHash(proofHash));

        // emit event
        emit ProofHashAdded(msg.sender, proofHash, index);
    }

    // view functions

    function getProofHashCount() public view returns (uint256 count) {
        count = _proofHashes.length;
    }

    function getProofHash(uint256 index) public view returns (bytes memory proofHash) {
        require(index < getProofHashCount(), "index out of range");
        proofHash = MultiHashWrapper._combineMultiHash(_proofHashes[index]);
    }

}
