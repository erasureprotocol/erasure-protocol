pragma solidity ^0.5.0;

import "./helpers/openzeppelin-eth/math/SafeMath.sol";
import "./helpers/openzeppelin-eth/token/ERC20/ERC20Burnable.sol";


contract UserRegistry {

    using SafeMath for uint256;

    User[] public users;

    address public nmr;

    struct User {
        address user;
        bytes metadata;
    }

    event UserCreated(uint256 userID, address user, bytes metadata);
    event UserUpdated(uint256 userID, address user, bytes metadata);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // USERS //

    function createUser(bytes memory metadata) public returns (uint256 userID) {

        userID = users.length;

        users.push(User(msg.sender, metadata));

        emit UserCreated(userID, msg.sender, metadata);
    }

    function updateUser(uint256 userID, bytes memory metadata) public {

        User storage user = users[userID];

        require(msg.sender == user.user, "only user");

        user.metadata = metadata;

        emit UserUpdated(userID, msg.sender, metadata);
    }

}
