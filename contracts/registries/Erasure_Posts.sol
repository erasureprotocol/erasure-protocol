pragma solidity ^0.5.13;

import "../modules/Registry.sol";


/// @title Erasure_Posts
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
contract Erasure_Posts is Registry {

    constructor() public Registry("Post") {

    }
}
