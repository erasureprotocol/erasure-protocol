pragma solidity ^0.5.0;

/*
 *  bytes4(keccak256('create(bytes)')) == 0xcf5ba53f
 *  bytes4(keccak256('getInstanceType()')) == 0x18c2f4cf
 *  bytes4(keccak256('getInstanceRegistry()')) == 0xa5e13904
 *  bytes4(keccak256('getImplementation()')) == 0xaaf10f42
 *
 *  => 0xcf5ba53f ^ 0x18c2f4cf ^ 0xa5e13904 ^ 0xaaf10f42 == 0xd88967b6
 */
interface IFactory {
    
    enum InstanceType { Invalid, Agreement, Post, Escrow }
    
    event InstanceCreated(address instance, bytes initData); // initData encoding?
    
    // should be atomic and revert on failure
    function create(bytes calldata initData) external returns (address instance);
    
    function getInstanceType() external view returns (InstanceType instanceType);
    function getInstanceRegistry() external view returns (address instanceRegistry);
    function getImplementation() external view returns (address implementation);
}