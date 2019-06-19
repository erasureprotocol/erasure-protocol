pragma solidity ^0.5.0;

import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";


contract ErasureNext_Escrow {

    using SafeMath for uint256;

    Escrow[] private escrows;

    struct Escrow {
        address payer;
        address counterparty;
        address token;
        uint256 amount;
        uint256 deadline;
        bytes metadata;
    }

    event EscrowCreated(uint256 escrowID, address payer, address counterparty, bytes metadata);
    event FundsSubmitted(uint256 escrowID, address token, uint256 amount, uint256 deadline);
    event DataSubmitted(uint256 escrowID, bytes encryptedData);
    event FundsWithdrawn(uint256 escrowID);

    // ESCROWS //

    function createEscrow(address payer, address counterparty, bytes memory metadata) public returns (uint256 escrowID) {

        escrowID = escrows.length;
        escrows.length++;
        Escrow storage escrow = escrows[escrowID];

        escrow.payer = payer;
        escrow.counterparty = counterparty;
        escrow.metadata = metadata;

        emit EscrowCreated(escrowID, payer, counterparty, metadata);
    }

    function submitFunds(uint256 escrowID, address token, uint256 amount, uint256 deadline) public {

        Escrow storage escrow = escrows[escrowID];

        require(msg.sender == escrow.payer);

        require(IERC20(token).transferFrom(msg.sender, address(this), amount));

        escrow.token = token;
        escrow.amount = amount;
        escrow.deadline = deadline;

        emit FundsSubmitted(escrowID, msg.sender, amount, escrow.deadline);
    }

    function submitData(uint256 escrowID, bytes memory data) public {

        Escrow storage escrow = escrows[escrowID];

        require(msg.sender == escrow.counterparty);
        require(block.timestamp < escrow.deadline); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        require(IERC20(escrow.token).transfer(msg.sender, escrow.amount));

        delete escrow.amount;

        emit DataSubmitted(escrowID, data);
    }

    function withdrawFunds(uint256 escrowID) public {

        Escrow storage escrow = escrows[escrowID];

        require(msg.sender == escrow.payer);
        require(block.timestamp >= escrow.deadline);

        require(IERC20(escrow.token).transfer(msg.sender, escrow.amount));

        delete escrow.amount;

        emit FundsWithdrawn(escrowID);
    }

    function createAndFund(address payer, address counterparty, bytes memory metadata, address token, uint256 amount, uint256 deadline) public returns (uint256 escrowID) {
        escrowID = createEscrow(payer, counterparty, metadata);
        submitFunds(escrowID, token, amount, deadline);
    }

    // Getters //

    function getEscrow(uint256 escrowID) public view returns (
        address payer,
        address counterparty,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata
    ) {
        payer = escrows[escrowID].payer;
        counterparty = escrows[escrowID].counterparty;
        token = escrows[escrowID].token;
        amount = escrows[escrowID].amount;
        deadline = escrows[escrowID].deadline;
        metadata = escrows[escrowID].metadata;
    }

    function getEscrowPayer(uint256 escrowID) public view returns (address payer) {
        payer = escrows[escrowID].payer;
    }

    function getEscrowCounterparty(uint256 escrowID) public view returns (address counterparty) {
        counterparty = escrows[escrowID].counterparty;
    }

    function getEscrowToken(uint256 escrowID) public view returns (address token) {
        token = escrows[escrowID].token;
    }

    function getEscrowAmount(uint256 escrowID) public view returns (uint256 amount) {
        amount = escrows[escrowID].amount;
    }

    function getEscrowDeadline(uint256 escrowID) public view returns (uint256 deadline) {
        deadline = escrows[escrowID].deadline;
    }

    function getEscrowMetadata(uint256 escrowID) public view returns (bytes memory metadata) {
        metadata = escrows[escrowID].metadata;
    }

}
