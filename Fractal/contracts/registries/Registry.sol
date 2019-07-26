pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/introspection/ERC165Checker.sol";
import "../helpers/openzeppelin-solidity/ownership/Ownable.sol";
import "../IFactory.sol";

contract Registry is Ownable {
    using ERC165Checker for address;

    enum RegistryType { Invalid, Agreement, Post, Escrow }

    event FactoryAdded(address factory, address implementation, uint256 index);
    event FactoryRetired(address factory, uint256 index);

    struct Factory {
        bool exists;
        uint16 index;
        address factoryAddress;
        address implementation;
        bool retired;
        bytes extraData;
    }

    /*
     *  bytes4(keccak256('create(bytes)')) == 0xcf5ba53f
     *  bytes4(keccak256('getInstanceType()')) == 0x18c2f4cf
     *  bytes4(keccak256('getInstanceRegistry()')) == 0xa5e13904
     *  bytes4(keccak256('getImplementation()')) == 0xaaf10f42
     *
     *  => 0xcf5ba53f ^ 0x18c2f4cf ^ 0xa5e13904 ^ 0xaaf10f42 == 0xd88967b6
     */ 
    bytes4 private constant _INTERFACE_ID_IFACTORY = 0xd88967b6;

    RegistryType private _registryType;
    address[] private _factoryAddresses;
    mapping(address => Factory) private _factories;

    constructor(RegistryType registryType) public {
        _registryType = registryType;
    }

    function addFactory(
        address factoryAddress,
        bytes calldata extraData
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryStorage = _factories[factoryAddress];
        
        // ensure that the provided factory is new.
        require(
            !factoryStorage.exists,
            "Factory already exists at the provided factory address."
        );

        // check the factory interface.
        require(
            factoryAddress._supportsInterface(_INTERFACE_ID_IFACTORY),
            "Factory does not support the required ERC165 interface."
        );
        IFactory factoryContract = IFactory(factoryAddress);

        // check the registry address.
        require(
            factoryContract.getInstanceRegistry() == address(this),
            "Factory does not recognize this registry."
        );

        // check the factory type.
        require(
            uint8(factoryContract.getInstanceType()) == uint8(_registryType),
            "Factory does not have the same type as this registry."
        );

        // get the implementation address.
        address implementation = factoryContract.getImplementation();
        require(
            implementation != address(0),
            "Factory does not have an implementation set."
        );

        // get the index of the new factory.
        uint16 index = uint16(_factoryAddresses.length);

        // set all of the information for the new factory.
        factoryStorage.exists = true;
        factoryStorage.index = index;
        factoryStorage.factoryAddress = factoryAddress;
        factoryStorage.implementation = implementation;
        factoryStorage.retired = false;
        factoryStorage.extraData = extraData;

        _factoryAddresses.push(factoryAddress);

        // emit an event.
        emit FactoryAdded(factoryAddress, implementation, index);
    }

    function retireFactory(
        address factoryAddress
    ) external onlyOwner() {
        // get the factory object from storage.
        Factory storage factoryStorage = _factories[factoryAddress];
        
        // ensure that the provided factory is new and not already retired.
        require(
            factoryStorage.exists,
            "Factory does not exist at the provided factory address."
        );
        require(
            !factoryStorage.retired,
            "Factory has already been retired."
        );

        // retire the factory.
        factoryStorage.retired = true;

        emit FactoryRetired(factoryAddress, factoryStorage.index);
    }

    // returning RegistryType here requires `pragma experimental ABIEncoderV2;`
    function getRegistryType() public view returns (uint8) {
        return uint8(_registryType);
    } 

    function getFactories() public view returns (address[] memory) {
        return _factoryAddresses;
    }

    // returning Factory here requires `pragma experimental ABIEncoderV2;`
    function getFactory(address factoryAddress) public view returns (
        bool exists,
        uint16 index,
        address implementation,
        bool retired,
        bytes memory extraData
    ) {
        Factory memory factory = _factories[factoryAddress];
        exists = factory.exists;
        index = factory.index;
        implementation = factory.implementation;
        retired = factory.retired;
        extraData = factory.extraData;
    }
}
