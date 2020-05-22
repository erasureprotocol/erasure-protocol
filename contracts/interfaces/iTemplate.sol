pragma solidity 0.5.16;

/// @title iTemplate
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
interface iTemplate {
    function getCreator() external view returns (address creator);
    function getFactory() external view returns (address factory);
    function getInitSelector() external view returns (bytes4 selector);
    function getInstanceType() external view returns (bytes4 selector);
}
