pragma solidity 0.5.16;

import "../modules/BurnDAI.sol";


contract TestBurnDAI is BurnDAI {

    function burnFrom(address from, uint256 value) external {
        BurnDAI._burnFrom(from, value);
    }

    function burn(uint256 value) external {
        BurnDAI._burn(value);
    }

    function _getExpectedSwapAmount(uint256 amountDAI) external view returns (uint256 amountNMR, uint256 amountETH) {
        return BurnDAI.getExpectedSwapAmount(amountDAI);
    }

    function _getTokenAddress() external pure returns (address token) {
        return BurnDAI.getTokenAddress();
    }

    function _getExchangeAddress() external pure returns (address exchange) {
        return BurnDAI.getExchangeAddress();
    }

}