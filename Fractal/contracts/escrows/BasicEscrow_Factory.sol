pragma solidity ^0.5.0;

import "../helpers/Spawner.sol";
import "./BasicEscrow.sol";
import "../modules/iFactoryRegistry.sol";


contract BasicEscrow_Factory is Spawner {

    function createExplicit(
        address tokenProvider,
        address dataProvider,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata
    ) public returns (address instance);

}
