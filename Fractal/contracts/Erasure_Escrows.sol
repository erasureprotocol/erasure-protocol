pragma solidity ^0.5.0;

import "./escrows/DataEscrow.sol";


contract Erasure_Escrows {

    address[] public escrows;

    event EscrowCreated(address escrow, address creator);

    function create(
        address tokenProvider,
        address dataProvider,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata
    ) public returns (address escrow) {
        escrow = address(new DataEscrow(tokenProvider, dataProvider, token, amount, deadline, metadata));
        escrows.push(escrow);
        emit EscrowCreated(escrow, msg.sender);
    }

}
