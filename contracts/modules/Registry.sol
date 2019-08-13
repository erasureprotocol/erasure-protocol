pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";


contract Registry is Ownable {

    enum FactoryStatus { Unregistered, Registered, Retired }

    event FactoryAdded(address owner, address factory, uint256 factoryID, bytes extraData);
    event FactoryRetired(address owner, address factory, uint256 factoryID);
    event InstanceRegistered(address indexed instance, address indexed factory, address indexed creator, uint256 instanceIndex, uint256 factoryID);

    address[] private _factoryList;
    mapping(address => Factory) private _factoryData;

    struct Factory {
        FactoryStatus status;
        uint16 factoryID;
        bytes extraData;
    }

    bytes4 private _instanceType;
    Instance[] private _instances;

    struct Instance {
        address instance;
        uint16 factoryID;
        uint80 extraData;
    }

    constructor(string memory instanceType) public {
        _instanceType = bytes4(keccak256(bytes(instanceType)));
    }

    // factory state functions

    function addFactory(
        address factory,
        bytes calldata extraData
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryData = _factoryData[factory];

        // ensure that the provided factory is new.
        require(
            factoryData.status == FactoryStatus.Unregistered,
            "factory already exists at the provided factory address"
        );

        // get the factoryID of the new factory.
        uint16 factoryID = uint16(_factoryList.length);

        // set all of the information for the new factory.
        factoryData.status = FactoryStatus.Registered;
        factoryData.factoryID = factoryID;
        factoryData.extraData = extraData;

        _factoryList.push(factory);

        // emit an event.
        emit FactoryAdded(msg.sender, factory, factoryID, extraData);
    }

    function retireFactory(
        address factory
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryData = _factoryData[factory];

        // ensure that the provided factory is new and not already retired.
        require(
            factoryData.status == FactoryStatus.Registered,
            "factory is not currently registered"
        );

        // retire the factory.
        factoryData.status = FactoryStatus.Retired;

        emit FactoryRetired(msg.sender, factory, factoryData.factoryID);
    }

    // factory view functions

    function getFactoryCount() external view returns (uint256 count) {
        count = _factoryList.length;
    }

    function getFactoryStatus(address factory) external view returns (FactoryStatus status) {
        status = _factoryData[factory].status;
    }

    function getFactoryID(address factory) external view returns (uint16 factoryID) {
        factoryID = _factoryData[factory].factoryID;
    }

    function getFactoryData(address factory) external view returns (bytes memory extraData) {
        extraData = _factoryData[factory].extraData;
    }

    function getFactoryAddress(uint16 factoryID) external view returns (address factory) {
        factory = _factoryList[factoryID];
    }

    function getFactory(address factory) public view returns (
        FactoryStatus status,
        uint16 factoryID,
        bytes memory extraData
    ) {
        Factory memory factoryData = _factoryData[factory];
        status = factoryData.status;
        factoryID = factoryData.factoryID;
        extraData = factoryData.extraData;
    }

    function getFactories() external view returns (address[] memory factories) {
        factories = _factoryList;
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getPaginatedFactories(uint256 startIndex, uint256 endIndex) external view returns (address[] memory factories) {
        require(startIndex < endIndex, "startIndex must be less than endIndex");
        require(endIndex <= _factoryList.length, "end index out of range");

        // initialize fixed size memory array
        address[] memory range = new address[](endIndex - startIndex);

        // Populate array with addresses in range
        for (uint256 i = startIndex; i < endIndex; i++) {
            range[i - startIndex] = _factoryList[i];
        }

        // return array of addresses
        factories = range;
    }

    // instance state functions

    function register(address instance, address creator, uint80 extraData) external {
        (
            FactoryStatus status,
            uint16 factoryID,
            // bytes memory extraData
        ) = getFactory(msg.sender);

        // ensure that the caller is a registered factory
        require(
            status == FactoryStatus.Registered,
            "factory in wrong status"
        );

        uint256 instanceIndex = _instances.length;
        _instances.push(
            Instance({
                instance: instance,
                factoryID: factoryID,
                extraData: extraData
            })
        );

        emit InstanceRegistered(instance, msg.sender, creator, instanceIndex, factoryID);
    }

    // instance view functions

    function getInstanceType() external view returns (bytes4 instanceType) {
        instanceType = _instanceType;
    }

    function getInstanceCount() external view returns (uint256 count) {
        count = _instances.length;
    }

    function getInstance(uint256 index) external view returns (address instance) {
        require(index < _instances.length, "index out of range");
        instance = _instances[index].instance;
    }

    function getInstanceData(uint256 index) external view
        returns (address instanceAddress, uint16 factoryID, uint80 extraData) {

        require(index < _instances.length, "index out of range");

        Instance memory instance = _instances[index];
        instanceAddress = instance.instance;
        factoryID = instance.factoryID;
        extraData = instance.extraData;
    }

    function getInstances() external view returns (address[] memory instances) {
        uint256 length = _instances.length;
        address[] memory addresses = new address[](length);

        // Populate array with addresses in range
        for (uint256 i = 0; i < length; i++) {
            addresses[i] = _instances[i].instance;
        }
        instances = addresses;
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getPaginatedInstances(uint256 startIndex, uint256 endIndex) external view returns (address[] memory instances) {
        require(startIndex < endIndex, "startIndex must be less than endIndex");
        require(endIndex <= _instances.length, "end index out of range");

        // initialize fixed size memory array
        address[] memory range = new address[](endIndex - startIndex);

        // Populate array with addresses in range
        for (uint256 i = startIndex; i < endIndex; i++) {
            range[i - startIndex] = _instances[i].instance;
        }

        // return array of addresses
        instances = range;
    }
}
