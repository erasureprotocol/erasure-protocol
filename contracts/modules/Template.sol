pragma solidity 0.5.16;

import "../interfaces/iFactory.sol";


/// @title Template
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module is imported by all template contracts to implement core functionality associated with the factories.
contract Template {

    address private _factory;
    bytes4 private _initSelector;
    bytes4 private _instanceType;

    // constructor

    constructor(string memory instanceType, bytes4 initSelector) public {
        // set init selector
        _initSelector = initSelector;
        // set instance type
        _instanceType = bytes4(keccak256(bytes(instanceType)));
    }

    // modifiers

    /// @notice Modifier which only allows to be `DELEGATECALL`ed from within a constructor on initialization of the contract.
    modifier initializeTemplate() {
        // set factory
        _factory = msg.sender;
        // only allow function to be `DELEGATECALL`ed from within a constructor.
        uint32 codeSize;
        assembly { codeSize := extcodesize(address) }
        require(codeSize == 0, "must be called within contract constructor");
        _;
    }

    // view functions

    /// @notice Get the address that created this clone.
    ///         Note, this cannot be trusted because it is possible to frontrun the create function and become the creator.
    /// @return creator address that created this clone.
    function getCreator() public view returns (address creator) {
        // iFactory(...) would revert if _factory address is not actually a factory contract
        return iFactory(_factory).getInstanceCreator(address(this));
    }

    /// @notice Validate if address matches the stored creator.
    /// @param caller address to validate.
    /// @return validity bool true if matching address.
    function isCreator(address caller) internal view returns (bool validity) {
        return (caller == getCreator());
    }

    /// @notice Get the address of the factory for this clone.
    /// @return factory address of the factory.
    function getFactory() public view returns (address factory) {
        return _factory;
    }

    /// @notice Get the selector of the initialization function for this clone.
    /// @return selector bytes4 initialization function selector.
    function getInitSelector() public view returns (bytes4 selector) {
        return _initSelector;
    }

    /// @notice Get the selector of the instance type for this clone.
    /// @return instanceType bytes4 instance type selector.
    function getInstanceType() public view returns (bytes4 instanceType) {
        return _instanceType;
    }

}
