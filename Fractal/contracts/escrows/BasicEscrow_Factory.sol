pragma solidity ^0.5.0;

import "./BasicEscrow.sol";

contract BasicEscrow_Factory {

    function createExplicit(
        address tokenProvider,
        address dataProvider,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata
    ) public returns (address instance);

}
