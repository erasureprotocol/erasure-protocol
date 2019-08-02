pragma solidity ^0.5.0;

import "../helpers/Spawner.sol";
import "./iFactoryRegistry.sol";


contract Factory is Spawner {

    address[] private _instances;

    /* NOTE: The following items can be hardcoded as constant to save ~200 gas/create */
    address private _templateContract;
    string private _Init_ABI;
    address private _instanceRegistry;
    bytes4 private _Instance_Type;

    event InstanceCreated(address indexed instance, address indexed creator, string initABI, bytes initData);

    function _initialize(address instanceRegistry, address templateContract, bytes4 instanceType, string memory initABI) internal {
        // set instance registry
        _instanceRegistry = instanceRegistry;

        // set logic contract
        _templateContract = templateContract;

        // set initABI
        _Init_ABI = initABI;

        // validate correct instance registry
        require(instanceType == iFactoryRegistry(instanceRegistry).getInstanceType(), 'incorrect instance type');

        // set instanceType
        _Instance_Type = instanceType;
    }

    // IFactory methods

    function create(bytes memory initData) public returns (address instance) {
        // deploy new contract: initialize it & write minimal proxy to runtime.
        instance = Spawner._spawn(getTemplate(), initData);

        // add the instance to the array
        _instances.push(instance);

        // add the instance to the instance registry
        iFactoryRegistry(getInstanceRegistry()).register(instance, msg.sender, uint64(0));

        // emit event
        emit InstanceCreated(instance, msg.sender, getInitABI(), initData);
    }

    function getInstanceType() public view returns (bytes4 instanceType) {
        instanceType = _Instance_Type;
    }

    function getInitABI() public view returns (string memory initABI) {
        initABI = _Init_ABI;
    }

    function getInstanceRegistry() public view returns (address instanceRegistry) {
        instanceRegistry = _instanceRegistry;
    }

    function getTemplate() public view returns (address template) {
        template = _templateContract;
    }

    function getInstanceCount() public view returns (uint256 count) {
        count = _instances.length;
    }

    function getInstance(uint256 index) public view returns (address instance) {
        require(index < _instances.length, "index out of range");
        instance = _instances[index];
    }

    function getInstances() public view returns (address[] memory instances) {
        instances = _instances;
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
        instances = range;
    }

}
