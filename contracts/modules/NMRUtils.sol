pragma solidity 0.5.16;

import "./iNMR.sol";

/// @title NMRUtils
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module simplifies calling NMR burn functions using regular openzeppelin ERC20Burnable interface and revert on failure.
///         This helper is required given the non-standard implementation of the NMR burn functions: https://github.com/numerai/contract
contract NMRUtils {

    // address of the token
    address private constant _NMRToken = address(0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671);

    /// @notice Burns a specific amount of NMR from this contract.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    function _burn(uint256 value) internal {
        require(iNMR(_NMRToken).mint(value), "NMRUtils/_burn: nmr.mint failed");
    }

    /// @notice Burns a specific amount of NMR from the target address and decrements allowance.
    /// @param from address The account whose tokens will be burned.
    /// @param value uint256 The amount of NMR (18 decimals) to be burned.
    function _burnFrom(address from, uint256 value) internal {
        require(iNMR(_NMRToken).numeraiTransfer(from, value), "NMRUtils/_burnFrom: nmr.numeraiTransfer failed");
    }

    /// @notice Forwards an NMR approval to an other address.
    /// @param from address The source account.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _forwardApproval(address from, address to, uint256 value) internal {
        // pull tokens
        require(iNMR(_NMRToken).transferFrom(from, address(this), value), "NMRUtils/_forwardApproval: nmr.transferFrom failed");
        // make approval
        _changeApproval(to, value);
    }

    /// @notice Updates an NMR approval.
    /// @param spender address The spender account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _changeApproval(address spender, uint256 value) internal {
        // get current approval
        uint256 currentApproval = iNMR(_NMRToken).allowance(address(this), spender);
        // set new approval
        require(iNMR(_NMRToken).changeApproval(spender, currentApproval, value), "NMRUtils/_changeApproval: nmr.changeApproval failed");
    }

    /// @notice Transfers NMR.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _transfer(address to, uint256 value) internal {
        require(iNMR(_NMRToken).transfer(to, value), "NMRUtils/_transfer: nmr.transfer failed");
    }

    /// @notice Transfers NMR from one account to an other.
    /// @param from address The source account.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _transferFrom(address from, address to, uint256 value) internal {
        require(iNMR(_NMRToken).transferFrom(from, to, value), "NMRUtils/_transferFrom: nmr.transferFrom failed");
    }

    /// @notice Creates an NMR approval.
    /// @param spender address The spender account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _approve(address spender, uint256 value) internal {
        require(iNMR(_NMRToken).approve(spender, value), "NMRUtils/_approve: nmr.approve failed");
    }

    /// @notice Get the NMR token address.
    /// @return token address The NMR token address.
    function getTokenAddress() internal pure returns (address token) {
        token = _NMRToken;
    }

}
