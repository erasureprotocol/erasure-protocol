pragma solidity 0.5.16;

import "../../interfaces/iNMR.sol";
import "./ERC20Utils.sol";

/// @title NMRUtils
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This module simplifies calling NMR functions using regular openzeppelin interface and revert on failure.
///         This helper is required given the non-standard implementation of the NMR burn functions: https://github.com/numerai/contract
contract NMRUtils is ERC20Utils {

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
        _transferFrom(from, address(this), value);
        // make approval
        _changeApproval(to, value);
    }

    /// @notice Updates an NMR approval.
    /// @param spender address The spender account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _changeApproval(address spender, uint256 value) internal {
        // get current approval
        uint256 currentApproval = IERC20(_NMRToken).allowance(address(this), spender);
        // set new approval
        require(iNMR(_NMRToken).changeApproval(spender, currentApproval, value), "NMRUtils/_changeApproval: nmr.changeApproval failed");
    }

    /// @notice Transfers NMR.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _transfer(address to, uint256 value) internal {
        ERC20Utils._transfer(_NMRToken, to, value);
    }

    /// @notice Transfers NMR from one account to an other.
    /// @param from address The source account.
    /// @param to address The recipient account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _transferFrom(address from, address to, uint256 value) internal {
        ERC20Utils._transferFrom(_NMRToken, from, to, value);
    }

    /// @notice Creates an NMR approval.
    /// @param spender address The spender account.
    /// @param value uint256 The amount of NMR (18 decimals).
    function _approve(address spender, uint256 value) internal {
        _changeApproval(spender, value);
    }

    /// @notice Get the NMR token address.
    /// @return token address The NMR token address.
    function getTokenAddress() internal pure returns (address token) {
        token = _NMRToken;
    }

}
