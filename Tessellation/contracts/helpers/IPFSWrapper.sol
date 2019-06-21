pragma solidity ^0.5.0;


/**
 * @title IPFSWrapper
 * @dev Contract that handles IPFS multi hash data structures and encoding/decoding
 *   Learn more here: https://github.com/multiformats/multihash
 */
contract IPFSWrapper {

  struct IPFSMultiHash {
    uint8 hashFunction;
    uint8 digestSize;
    bytes32 hash;
  }

  // CONSTRUCTOR

  constructor () public {

  }

  // INTERNAL FUNCTIONS

  /**
   * @dev Given an IPFS multihash struct, returns the full base58-encoded IPFS hash
   * @param _multiHash IPFSMultiHash struct that has the hashFunction, digestSize and the hash
   * @return the base58-encoded full IPFS hash
   */
  function combineIPFSHash(IPFSMultiHash memory _multiHash) internal pure returns (bytes memory) {
    bytes memory out = new bytes(34);

    out[0] = byte(_multiHash.hashFunction);
    out[1] = byte(_multiHash.digestSize);

    uint8 i;
    for (i = 0; i < 32; i++) {
      out[i+2] = _multiHash.hash[i];
    }

    return out;
  }

  /**
   * @dev Given a base58-encoded IPFS hash, divides into its individual parts and returns a struct
   * @param _source base58-encoded IPFS hash
   * @return IPFSMultiHash that has the hashFunction, digestSize and the hash
   */
  function splitIPFSHash(bytes memory _source) internal pure returns (IPFSMultiHash memory) {
    uint8 hashFunction = uint8(_source[0]);
    uint8 digestSize = uint8(_source[1]);
    bytes32 hash;

    assembly {
      hash := mload(add(_source, 34))
    }

    return (IPFSMultiHash({
      hashFunction: hashFunction,
      digestSize: digestSize,
      hash: hash
    }));
  }
}
