pragma solidity ^0.5.0;


interface iFactoryRegistry {

    enum FactoryState { Unregistered, Registered, Retired }

    event FactoryAdded(address owner, address factory, uint256 factoryID, bytes extraData);
    event FactoryRetired(address owner, address factory, uint256 factoryID);
    event InstanceRegistered(address instance, uint256 instanceIndex, address indexed creator, address indexed factory, uint256 indexed factoryID);

    // factory state functions

    function addFactory(address factory, bytes calldata extraData ) external;
    function retireFactory(address factory) external;

    // factory view functions

    function getFactoryCount() external view returns (uint256 count);
    function getFactory(address factory) external view returns (FactoryState state, uint16 factoryID, bytes memory extraData);
    function getFactories() external view returns (address[] memory factories);
    function getPaginatedFactories(uint256 startIndex, uint256 endIndex) external view returns (address[] memory factories);

    // instance state functions

    function register(address instance, address creator, uint64 extraData) external;

    // instance view functions

    function getInstanceType() external view returns (bytes4 instanceType);
    function getInstanceCount() external view returns (uint256 count);
    function getInstance(uint256 index) external view returns (address instance);
    function getInstances() external view returns (address[] memory instances);
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) external view returns (address[] memory instances);
}
