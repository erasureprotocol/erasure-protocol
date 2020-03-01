pragma solidity 0.5.16;

import "../modules/TokenManager.sol";


contract TestTokenManager is TokenManager {

    function _isValidTokenID(Tokens tokenID) public pure returns (bool validity) {
        return TokenManager.isValidTokenID(tokenID);
    }

    function transfer(Tokens tokenID, address to, uint256 value) public {
        TokenManager._transfer(tokenID, to, value);
    }

    function transferFrom(Tokens tokenID, address from, address to, uint256 value) public {
        TokenManager._transferFrom(tokenID, from, to, value);
    }

    function burn(Tokens tokenID, uint256 value) public {
        TokenManager._burn(tokenID, value);
    }

    function burnFrom(Tokens tokenID, address from, uint256 value) public {
        TokenManager._burnFrom(tokenID, from, value);
    }

    function approve(Tokens tokenID, address spender, uint256 value) public {
        TokenManager._approve(tokenID, spender, value);
    }

    function _totalSupply(Tokens tokenID) public view returns (uint256 value) {
        return TokenManager.totalSupply(tokenID);
    }

    function _balanceOf(Tokens tokenID, address who) public view returns (uint256 value) {
        return TokenManager.balanceOf(tokenID, who);
    }

    function _allowance(Tokens tokenID, address owner, address spender) public view returns (uint256 value) {
        return TokenManager.allowance(tokenID, owner, spender);
    }
}