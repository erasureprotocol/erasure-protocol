pragma solidity ^0.5.0;

import "../modules/FactoryRegistry.sol";


contract Erasure_Agreements is FactoryRegistry {

    constructor() public FactoryRegistry('Agreement') {

    }
}
