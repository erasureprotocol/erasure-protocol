pragma solidity ^0.5.0;

import "./IFactory.sol";
import "./helpers/openzeppelin-solidity/introspection/ERC165.sol";


contract Factory is IFactory, ERC165 {
	address private constant _instanceRegistry = address(0); // TODO: set this

    /*
     *     bytes4(keccak256('create(bytes)')) == 0xcf5ba53f
     *     bytes4(keccak256('getInstanceType()')) == 0x18c2f4cf
     *     bytes4(keccak256('getInstanceRegistry()')) == 0xa5e13904
     *     bytes4(keccak256('getImplementation()')) == 0xaaf10f42
     *
     *     => 0xcf5ba53f ^ 0x18c2f4cf ^ 0xa5e13904 ^ 0xaaf10f42 == 0xd88967b6
     */
    bytes4 private constant _INTERFACE_ID_IFACTORY = 0xd88967b6;

    InstanceType private _instanceType;

	constructor(InstanceType instanceType) public {
		_instanceType = instanceType;
		_registerInterface(_INTERFACE_ID_IFACTORY);
	}

    // should be atomic and revert on failure
    function create(bytes calldata initData) external returns (address instance) {
    	// implement on contract that inherits Factory
    }
    
    function getInstanceType() external view returns (InstanceType instanceType) {
    	instanceType = _instanceType;
    }

    function getInstanceRegistry() external view returns (address instanceRegistry) {
    	instanceRegistry = _instanceRegistry;
    }

    function getImplementation() external view returns (address implementation) {
    	// implement on contract that inherits Factory
    }
}