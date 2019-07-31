pragma solidity ^0.5.0;

import "../helpers/Spawner.sol";
import "./MultiPartyGriefing.sol";
import "../modules/iFactoryRegistry.sol";


contract MultiPartyGriefing_Factory is Spawner {

    address private _logicContract; // NOTE: deploy first & use constant to save ~200 gas/create
    address[] private _instances;

    bytes4 private constant _Instance_Type = bytes4(keccak256(bytes('Agreement')));
    string private constant _Init_ABI = '(address,address,bool,uint256,bytes)';
    address private _instanceRegistry;


    constructor(address instanceRegistry) public {
        // deploy logic contract - skip initialization (cannot directly access)
        _logicContract = address(new MultiPartyGriefing());

        // validate correct instance registry
        require(getInstanceType() == iFactoryRegistry(instanceRegistry).getInstanceType(), 'incorrect instance type');

        // set instance registry
        _instanceRegistry = instanceRegistry;
    }

    // standard IFactory methods

    event InstanceCreated(address indexed instance, address indexed creator, string initABI, bytes initData);

    function create(bytes calldata initData) external returns (address instance) {

        // decode initialization data
        (
            address operator,
            address token,
            bool trustedOperator,
            uint256 griefDeadline,
            bytes memory metadata
        ) = abi.decode(initData, (address,address,bool,uint256,bytes));

        // call internal create function with initialization data
        instance = createExplicit(operator, token, trustedOperator, griefDeadline, metadata);

        // emit event
        emit InstanceCreated(instance, msg.sender, _Init_ABI, initData);
    }

    function getInstanceType() public pure returns (bytes4 instanceType) {
        instanceType = _Instance_Type;
    }

    function getInitABI() external pure returns (string memory initABI) {
        initABI = _Init_ABI;
    }

    function getInstanceRegistry() external view returns (address instanceRegistry) {
        instanceRegistry = _instanceRegistry;
    }

    function getImplementation() external view returns (address implementation) {
        implementation = _logicContract;
    }

    function getInstanceCount() external view returns (uint256 count) {
        count = _instances.length;
    }

    function getInstance(uint256 index) external view returns (address instance) {
        require(index < _instances.length, "index out of range");
        instance = _instances[index];
    }

    function getInstances() external view returns (address[] memory instances) {
        instances = _instances;
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) external view returns (address[] memory instances) {
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

    // Non-standard methods

    event InitData(address indexed instance, address indexed operator, bool trustedOperator, uint256 griefDeadline, address token, bytes metadata);

    function createExplicit(
        address operator,
        address token,
        bool trustedOperator,
        uint256 griefDeadline,
        bytes memory metadata
    ) public returns (address instance) {

        // construct the data payload used when initializing the new contract.
        bytes memory initializationCalldata = abi.encodeWithSelector(
            MultiPartyGriefing(_logicContract).initialize.selector, // selector
            operator,        // operator
            token,           // token
            trustedOperator, // trustedOperator
            griefDeadline,   // griefDeadline
            metadata         // metadata
        );

        // deploy new contract: initialize it & write minimal proxy to runtime.
        instance = _spawn(_logicContract, initializationCalldata);

        // add the instance to the array
        _instances.push(instance);

        // add the instance to the instance registry
        iFactoryRegistry(_instanceRegistry).register(instance, msg.sender, uint64(0));

        // emit events
        emit InitData(instance, operator, trustedOperator, griefDeadline, token, metadata);
    }

}
