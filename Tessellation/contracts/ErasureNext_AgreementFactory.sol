pragma solidity ^0.5.0;

import "./IFactory.sol";


contract ErasureNext_AgreementFactory {

    address token;
    address[] public factories;

    constructor(address _token) public {
        token = _token;
    }

    function addFactory(address factory) public {
        factories.push(factory);
    }

    function createInstance(address factory, bytes memory initData) public returns (address instance) {
        instance = IFactory(factory).createInstance(factory, initData);
    }

    function getMetadata(address factory) public returns (bytes memory metadata) {
        metadata = IFactory(factory).getMetadata();
    }

}
