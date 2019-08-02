pragma solidity ^0.5.0;

import "../modules/FactoryRegistry.sol";


contract Erasure_Escrows is FactoryRegistry {

    constructor() public FactoryRegistry('Escrow') {

    }
}
