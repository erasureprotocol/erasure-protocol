pragma solidity ^0.5.0;

import "../helpers/Spawner.sol";
import "./Post.sol";
import "../modules/iFactoryRegistry.sol";


contract Post_Factory is Spawner {

    function create(
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public returns (address instance);

}
