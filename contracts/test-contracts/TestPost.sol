pragma solidity ^0.5.0;

import "../posts/Post.sol";
import "./OperatorAccess.sol";

contract TestPost is Post, OperatorAccess {
}
