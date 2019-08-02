pragma solidity ^0.5.0;

import "./iNMR.sol";

/**
 * @title NMR token burning helper
 * @dev Allows for calling NMR burn functions using regular openzeppelin ERC20Burnable interface and revert on failure.
 */
contract BurnNMR {

    // address of the token
    address private _Token; // can be hardcoded on mainnet deployment to reduce cost

    function _setToken(address token) internal {
        // set storage
        _Token = token;
    }

    /**
     * @dev Burns a specific amount of tokens.
     * @param value The amount of token to be burned.
     */
    function _burn(uint256 value) internal {
        require(iNMR(_Token).mint(value), "nmr burn failed");
    }

    /**
     * @dev Burns a specific amount of tokens from the target address and decrements allowance.
     * @param from address The account whose tokens will be burned.
     * @param value uint256 The amount of token to be burned.
     */
    function _burnFrom(address from, uint256 value) internal {
        require(iNMR(_Token).numeraiTransfer(from, value), "nmr burnFrom failed");
    }

    function getToken() public view returns (address token) {
        token = _Token;
    }

}
