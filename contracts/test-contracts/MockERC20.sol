pragma solidity ^0.5.13;

import "../helpers/openzeppelin-solidity/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {

    function mintMockTokens(address to, uint256 value) public {
        _mint(to, value);
    }
}
