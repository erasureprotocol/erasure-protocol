pragma solidity ^0.5.0;

import "./MockERC20.sol";


contract MockNMR is MockERC20 {
    uint8 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(DECIMALS));

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor () public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param value The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mintMockTokens(address to, uint256 value) public returns (bool) {
        _mint(to, value);
        return true;
    }

    /**
     * @dev Burns a specific amount of tokens.
     * @param _value The amount of token to be burned.
     */
    function mint(uint256 _value) public returns (bool status) {
        status = _burn(msg.sender, _value);
    }

    /**
     * @dev Burns a specific amount of tokens from the target address and decrements allowance.
     * @param _to address The account whose tokens will be burned.
     * @param _value uint256 The amount of token to be burned.
     */
    function numeraiTransfer(address _to, uint256 _value) public returns (bool status) {
        status = _burnFrom(_to, _value);
    }
}
