pragma solidity 0.5.16;


/// @title iRegistry
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
interface iRegistry {

    enum FactoryStatus { Unregistered, Registered, Retired }

    event FactoryAdded(address owner, address factory, uint256 factoryID, bytes extraData);
    event FactoryRetired(address owner, address factory, uint256 factoryID);
    event InstanceRegistered(address instance, uint256 instanceIndex, address indexed creator, address indexed factory, uint256 indexed factoryID);

    // factory state functions

    function addFactory(address factory, bytes calldata extraData ) external;
    function retireFactory(address factory) external;

    // factory view functions

    function getFactoryCount() external view returns (uint256 count);
    function getFactoryStatus(address factory) external view returns (FactoryStatus status);
    function getFactoryID(address factory) external view returns (uint16 factoryID);
    function getFactoryData(address factory) external view returns (bytes memory extraData);
    function getFactoryAddress(uint16 factoryID) external view returns (address factory);
    function getFactory(address factory) external view returns (FactoryStatus state, uint16 factoryID, bytes memory extraData);
    function getFactories() external view returns (address[] memory factories);
    function getPaginatedFactories(uint256 startIndex, uint256 endIndex) external view returns (address[] memory factories);

    // instance state functions

    function register(address instance, address creator, uint80 extraData) external;

    // instance view functions

    function getInstanceType() external view returns (bytes4 instanceType);
    function getInstanceCount() external view returns (uint256 count);
    function getInstance(uint256 index) external view returns (address instance);
    function getInstances() external view returns (address[] memory instances);
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) external view returns (address[] memory instances);
}
