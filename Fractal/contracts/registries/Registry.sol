pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";
import "../IFactory.sol";

contract Registry is Ownable {

    enum FactoryState { Unregistered, Registered, Retired }

    event FactoryAdded(address owner, address factory, uint256 factoryID, bytes extraData);
    event FactoryRetired(address owner, address factory, uint256 factoryID);

    struct Factory {
        FactoryState state;
        uint16 factoryID;
        address factoryAddress;
        bytes extraData;
    }

    bytes4 private _registryType;
    address[] private _factoryAddresses;
    mapping(address => Factory) private _factories;

    constructor(string memory registryType) public {
        _registryType = bytes4(keccak256(bytes(registryType)));
    }

    function addFactory(
        address factoryAddress,
        bytes calldata extraData
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryStorage = _factories[factoryAddress];

        // ensure that the provided factory is new.
        require(
            factoryStorage.state == FactoryState.Unregistered,
            "Factory already exists at the provided factory address."
        );

        // get the factoryID of the new factory.
        uint16 factoryID = uint16(_factoryAddresses.length);

        // set all of the information for the new factory.
        factoryStorage.state = FactoryState.Registered;
        factoryStorage.factoryID = factoryID;
        factoryStorage.factoryAddress = factoryAddress;
        factoryStorage.extraData = extraData;

        _factoryAddresses.push(factoryAddress);

        // emit an event.
        emit FactoryAdded(msg.sender, factoryAddress, factoryID, extraData);
    }

    function retireFactory(
        address factoryAddress
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryStorage = _factories[factoryAddress];

        // ensure that the provided factory is new and not already retired.
        require(
            factoryStorage.state == FactoryState.Registered,
            "Factory in wrong state."
        );

        // retire the factory.
        factoryStorage.state = FactoryState.Retired;

        emit FactoryRetired(msg.sender, factoryAddress, factoryStorage.factoryID);
    }

    function getRegistryType() public view returns (bytes4 registryType) {
        registryType = _registryType;
    }

    function getFactories() public view returns (address[] memory) {
        return _factoryAddresses;
    }

    function getFactory(address factoryAddress) public view returns (
        FactoryState state,
        uint16 factoryID,
        bytes memory extraData
    ) {
        Factory memory factory = _factories[factoryAddress];
        state = factory.state;
        factoryID = factory.factoryID;
        extraData = factory.extraData;
    }
}
