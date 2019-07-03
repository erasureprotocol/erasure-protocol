pragma solidity ^0.5.0;

import "./helpers/HitchensUnorderedAddressSet.sol";


contract ErasureNext_UserMetadata {

    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;
    HitchensUnorderedAddressSetLib.Set users;

    mapping (address => bytes) public metadata;

    event MetadataSet(address indexed user, bytes metadata);

    function setMetadata(bytes memory data) public {

        metadata[msg.sender] = data;

        if (data.length == 0 && users.exists(msg.sender)) {
            users.remove(msg.sender);
        }

        if (!users.exists(msg.sender)) {
            users.insert(msg.sender);
        }

        emit MetadataSet(msg.sender, data);
    }
}
