pragma solidity 0.5.16;

import "./Spawner.sol";
import "./iRegistry.sol";
import "./iFactory.sol";


/// @title Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice The factory contract implements a standard interface for creating EIP-1167 clones of a given template contract.
///         The create functions accept abi-encoded calldata used to initialize the spawned templates.
contract Factory is Spawner, iFactory {

    address[] private _instances;
    mapping (address => address) private _instanceCreator;

    /* NOTE: The following items can be hardcoded as constant to save ~200 gas/create */
    address private _templateContract;
    bytes4 private _initSelector;
    address private _instanceRegistry;
    bytes4 private _instanceType;

    event InstanceCreated(address indexed instance, address indexed creator, bytes callData);

    /// @notice Constructior
    /// @param instanceRegistry address of the registry where all clones are registered.
    /// @param templateContract address of the template used for making clones.
    /// @param instanceType bytes4 identifier for the type of the factory. This must match the type of the registry.
    /// @param initSelector bytes4 selector for the template initialize function.
    function _initialize(address instanceRegistry, address templateContract, bytes4 instanceType, bytes4 initSelector) internal {
        // set instance registry
        _instanceRegistry = instanceRegistry;
        // set logic contract
        _templateContract = templateContract;
        // set initSelector
        _initSelector = initSelector;
        // validate correct instance registry
        require(instanceType == iRegistry(instanceRegistry).getInstanceType(), 'incorrect instance type');
        // set instanceType
        _instanceType = instanceType;
    }

    // IFactory methods

    /// @notice Create clone of the template using a nonce.
    ///         The nonce is unique for clones with the same initialization calldata.
    ///         The nonce can be used to determine the address of the clone before creation.
    ///         The callData must be prepended by the function selector of the template's initialize function and include all parameters.
    /// @param callData bytes blob of abi-encoded calldata used to initialize the template.
    /// @return instance address of the clone that was created.
    function create(bytes memory callData) public returns (address instance) {
        // deploy new contract: initialize it & write minimal proxy to runtime.
        instance = Spawner._spawn(msg.sender, getTemplate(), callData);

        _createHelper(instance, callData);

        return instance;
    }

    /// @notice Create clone of the template using a salt.
    ///         The salt must be unique for clones with the same initialization calldata.
    ///         The salt can be used to determine the address of the clone before creation.
    ///         The callData must be prepended by the function selector of the template's initialize function and include all parameters.
    /// @param callData bytes blob of abi-encoded calldata used to initialize the template.
    /// @return instance address of the clone that was created.
    function createSalty(bytes memory callData, bytes32 salt) public returns (address instance) {
        // deploy new contract: initialize it & write minimal proxy to runtime.
        instance = Spawner._spawnSalty(msg.sender, getTemplate(), callData, salt);

        _createHelper(instance, callData);

        return instance;
    }

    /// @notice Private function to help with the creation of the clone.
    ///         Stores the address of the clone in this contract.
    ///         Stores the creator of the clone in this contract.
    ///         Registers the address of the clone in the registry. Fails if the factory is deprecated.
    ///         Emits standard InstanceCreated event
    /// @param instance address The address of the clone that was created.
    /// @param callData bytes The initialization calldata to use on the clone.
    function _createHelper(address instance, bytes memory callData) private {
        // add the instance to the array
        _instances.push(instance);
        // set instance creator
        _instanceCreator[instance] = msg.sender;
        // add the instance to the instance registry
        iRegistry(getInstanceRegistry()).register(instance, msg.sender, uint80(0));
        // emit event
        emit InstanceCreated(instance, msg.sender, callData);
    }

    /// @notice Get the address of an instance for a given salt
    function getSaltyInstance(
        address creator,
        bytes memory callData,
        bytes32 salt
    ) public view returns (address instance, bool validity) {
        return Spawner._getSaltyTarget(creator, getTemplate(), callData, salt);
    }

    function getNextNonceInstance(
        address creator,
        bytes memory callData
    ) public view returns (address target) {
        return Spawner._getNextNonceTarget(creator, getTemplate(), callData);
    }

    function getInstanceCreator(address instance) public view returns (address creator) {
        return _instanceCreator[instance];
    }

    function getInstanceType() public view returns (bytes4 instanceType) {
        return _instanceType;
    }

    function getInitSelector() public view returns (bytes4 initSelector) {
        return _initSelector;
    }

    function getInstanceRegistry() public view returns (address instanceRegistry) {
        return _instanceRegistry;
    }

    function getTemplate() public view returns (address template) {
        return _templateContract;
    }

    function getInstanceCount() public view returns (uint256 count) {
        return _instances.length;
    }

    function getInstance(uint256 index) public view returns (address instance) {
        require(index < _instances.length, "index out of range");
        return _instances[index];
    }

    function getInstances() public view returns (address[] memory instances) {
        return _instances;
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) public view returns (address[] memory instances) {
        require(startIndex < endIndex, "startIndex must be less than endIndex");
        require(endIndex <= _instances.length, "end index out of range");

        // initialize fixed size memory array
        address[] memory range = new address[](endIndex - startIndex);

        // Populate array with addresses in range
        for (uint256 i = startIndex; i < endIndex; i++) {
            range[i - startIndex] = _instances[i];
        }

        // return array of addresses
        return range;
    }

}
