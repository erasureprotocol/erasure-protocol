pragma solidity ^0.5.0;

import "./Symmetric.sol";


contract Symmetric_Factory {

    using SafeMath for uint256;

    address[] public instances;

    bytes public metadata;

    constructor(address _metadata) public {
        metadata = _metadata;
    }

    // TEMPLATES //

    function createInstance(address token, bytes memory initData) public returns (address instance) {

        (
            uint256 stake,
            uint256 deadline,
            bytes memory metadata
        ) = abi.decode(initData, (uint256, uint256, bytes));

        instance = new Symmetric(token, msg.sender, stake, deadline, metadata);

        instances.push(instance);
    }

}
