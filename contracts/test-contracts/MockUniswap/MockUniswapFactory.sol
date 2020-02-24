pragma solidity 0.5.16;

import "./MockUniswapExchange.sol";


contract MockUniswapFactory {

  /***********************************|
  |       Events And Variables        |
  |__________________________________*/

  event NewExchange(address indexed token, address indexed exchange);

  uint256 public tokenCount;
  mapping (address => address payable) internal token_to_exchange;
  mapping (address => address) internal exchange_to_token;
  mapping (uint256 => address) internal id_to_token;

  /***********************************|
  |         Factory Functions         |
  |__________________________________*/
  
  function createExchange(address token, address payable exchange) public returns (address payable) {
    require(token != address(0));
    require(token_to_exchange[token] == address(0));
    token_to_exchange[token] = exchange;
    exchange_to_token[exchange] = token;
    uint256 token_id = tokenCount + 1;
    tokenCount = token_id;
    id_to_token[token_id] = token;
    emit NewExchange(token, exchange);
    return exchange;
  }

  /***********************************|
  |         Getter Functions          |
  |__________________________________*/

  function getExchange(address token) public view returns (address payable) {
    return token_to_exchange[token];
  }

  function getToken(address exchange) public view returns (address) {
    return exchange_to_token[exchange];
  }

  function getTokenWithId(uint256 token_id) public view returns (address) {
    return id_to_token[token_id];
  }

}