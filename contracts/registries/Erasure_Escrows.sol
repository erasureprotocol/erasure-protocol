pragma solidity 0.5.16;

import "../modules/Registry.sol";


/// @title Erasure_Escrows
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
contract Erasure_Escrows is Registry {

    constructor() public Registry('Escrow') {

    }
}
