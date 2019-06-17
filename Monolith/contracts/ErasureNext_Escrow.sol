pragma solidity ^0.5.0;

import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/IERC20.sol";


contract ErasureNext_Escrow {

    using SafeMath for uint256;

    Escrow[] private escrows;

    struct Escrow {
        address buyer;
        address seller;
        uint256 agreementID
        address token;
        uint256 amount;
        uint256 deadline;
    }

    event EscrowCreated(uint256 escrowID, uint256 agreementID, address buyer, address seller);
    event FundsSubmitted(uint256 escrowID, address owner, bytes metadata, uint256 stake, bool symmetricGrief);
    event DataSubmitted(uint256 escrowID, bytes encryptedData);
    event FundsWithdrawn(uint256 escrowID);

    // ESCROWS //

    function createEscrow(uint256 agreementID, address buyer, address seller) returns (uint256 escrowID) {

        escrowID = escrows.length;
        escrows.length++;
        Escrow escrow = escrows[escrowID];

        escrow.buyer = buyer;
        escrow.seller = seller;
        escrow.agreementID = agreementID;

        emit EscrowCreated(escrowID, agreementID, buyer, seller);
    }

    function submitFunds(uint256 escrowID, address token, uint256 amount, uint256 lockTime) public {

        Escrow escrow = escrows[escrowID];

        require(msg.sender == escrow.buyer);

        escrow.token = token;
        escrow.amount = amount;
        escrow.deadline = lockTime.add(block.timestamp);

        require(IERC20(token).transferFrom(msg.sender, address(this), amount));

        emit FundsSubmitted(escrowID, owner, metadata, stake, symmetricGrief);
    }

    function submitData(uint256 escrowID, bytes memory encryptedData) public {

        Escrow escrow = escrows[escrowID];

        require(msg.sender == escrow.seller);
        require(block.timestamp < escrow.deadline); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        delete escrow.amount;

        require(IERC20(escrow.token).transfer(msg.sender, escrow.amount));

        emit DataSubmitted(escrowID, encryptedData);
    }

    function withdrawFunds(uint256 escrowID) public {

        Escrow escrow = escrows[escrowID];

        require(msg.sender == escrow.buyer);
        require(block.timestamp >= escrow.deadline);

        delete escrow.amount;

        require(IERC20(escrow.token).transfer(msg.sender, escrow.amount));

        emit FundsWithdrawn(escrowID);
    }

}
