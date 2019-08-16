pragma solidity ^0.5.0;

import "../posts/Feed.sol";
import "./OperatorAccess.sol";

contract TestFeed is Feed, OperatorAccess {
}
