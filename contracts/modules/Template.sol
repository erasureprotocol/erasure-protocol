pragma solidity ^0.5.0;

import "./iFactory.sol";


/// @title Template
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract Template {

    address private _factory;

    // modifiers

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

    function getCreator() public view returns (address creator) {
        // iFactory(...) would revert if _factory address is not actually a factory contract
        return iFactory(_factory).getInstanceCreator(address(this));
    }

    function isCreator(address caller) internal view returns (bool ok) {
        return (caller == getCreator());
    }

    function getFactory() public view returns (address factory) {
        return _factory;
    }

}
