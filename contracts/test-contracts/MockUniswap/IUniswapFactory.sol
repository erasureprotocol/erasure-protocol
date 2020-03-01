pragma solidity 0.5.16;


contract IUniswapFactory {
    // Events
    event NewExchange(address indexed token, address indexed exchange);
    // Public Variables
    uint256 public tokenCount;
    // Create Exchange
    function createExchange(address token, address payable exchange) external returns (address payable);
    // Get Exchange and Token Info
    function getExchange(address token) external view returns (address payable exchange);
    function getToken(address payable exchange) external view returns (address token);
    function getTokenWithId(uint256 tokenId) external view returns (address token);
}