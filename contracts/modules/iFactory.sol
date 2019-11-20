pragma solidity ^0.5.0;

/// @title iFactory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
interface iFactory {

    event InstanceCreated(address indexed instance, address indexed creator, string initABI, bytes initData);

    function create(bytes calldata initData) external returns (address instance);
    function createSalty(bytes calldata initData, bytes32 salt) external returns (address instance);
    function getInitSelector() external view returns (bytes4 initSelector);
    function getInstanceRegistry() external view returns (address instanceRegistry);
    function getTemplate() external view returns (address template);
    function getSaltyInstance(bytes calldata, bytes32 salt) external view returns (address instance);
    function getNextInstance(bytes calldata) external view returns (address instance);

    function getInstanceCreator(address instance) external view returns (address creator);
    function getInstanceType() external view returns (bytes4 instanceType);
    function getInstanceCount() external view returns (uint256 count);
    function getInstance(uint256 index) external view returns (address instance);
    function getInstances() external view returns (address[] memory instances);
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) external view returns (address[] memory instances);
}
