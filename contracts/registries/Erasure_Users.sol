pragma solidity 0.5.16;

import "../helpers/HitchensUnorderedAddressSetLib.sol";


/// @title Erasure_Users
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
contract Erasure_Users {

    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;
    HitchensUnorderedAddressSetLib.Set private _users;

    mapping (address => bytes) private _metadata;

    event UserRegistered(address indexed user, bytes data);
    event UserRemoved(address indexed user);

    // state functions

    function registerUser(bytes memory data) public {
        require(!_users.exists(msg.sender), "user already exists");

        // add user
        _users.insert(msg.sender);

        // set metadata
        _metadata[msg.sender] = data;

        // emit event
        emit UserRegistered(msg.sender, data);
    }

    function removeUser() public {
        // require user is registered
        require(_users.exists(msg.sender), "user does not exist");

        // remove user
        _users.remove(msg.sender);

        // delete metadata
        delete _metadata[msg.sender];

        // emit event
        emit UserRemoved(msg.sender);
    }

    // view functions

    function getUserData(address user) public view returns (bytes memory data) {
        data = _metadata[user];
    }

    function getUsers() public view returns (address[] memory users) {
        users = _users.keyList;
    }

    function getUserCount() public view returns (uint256 count) {
        count = _users.count();
    }

    // Note: startIndex is inclusive, endIndex exclusive
    function getPaginatedUsers(uint256 startIndex, uint256 endIndex) public view returns (address[] memory users) {
        require(startIndex < endIndex, "startIndex must be less than endIndex");
        require(endIndex <= _users.count(), "end index out of range");

        // initialize fixed size memory array
        address[] memory range = new address[](endIndex - startIndex);

        // Populate array with addresses in range
        for (uint256 i = startIndex; i < endIndex; i++) {
            range[i - startIndex] = _users.keyAtIndex(i);
        }

        // return array of addresses
        users = range;
    }
}
