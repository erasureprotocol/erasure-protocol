pragma solidity 0.5.16;

import "../modules/Registry.sol";


/// @title Erasure_Posts
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
contract Erasure_Posts is Registry {

    constructor() public Registry("Post") {

    }
}
