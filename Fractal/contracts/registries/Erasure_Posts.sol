pragma solidity ^0.5.0;

import "../modules/FactoryRegistry.sol";


contract Erasure_Posts is FactoryRegistry {

    constructor() public FactoryRegistry('Post') {

    }
}
