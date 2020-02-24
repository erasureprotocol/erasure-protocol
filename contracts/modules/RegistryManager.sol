pragma solidity 0.5.16;

import "./Registry.sol";
import "./Manageable.sol";

/// @title RegistryManager
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This module allows for managing instance registries.
contract RegistryManager is Manageable {
    
    /// @notice Add an instance factory to the registry.
    /// @param registry address of the target registry.
    /// @param factory address of the factory to be added.
    /// @param extraData bytes extra factory specific data that can be accessed publicly.
    function addFactory(
        address registry,
        address factory,
        bytes calldata extraData
    ) external onlyManagerOrOwner() {
        Registry(registry).addFactory(factory, extraData);
    }
    
    /// @notice Remove an instance factory from the registry.
    /// @param registry address of the target registry.
    /// @param factory address of the factory to be removed.
    function retireFactory(
        address registry,
        address factory
    ) external onlyManagerOrOwner() {
        Registry(registry).retireFactory(factory);
    }
}