pragma solidity ^0.5.0;

import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";


/* Escrow contract to swap data for tokens
 *
 * Tokens are locked by the token provider until the deadline. If the data provider does not submit the data by the deadline, the tokens can be recovered.
 * Payment must always occur before data submission else the data is revealed.
 *
 * Current specs:
 * - Can be opened by either party
 * - Can specify counterparty or allow for anyone to participate
 * - Can only specify price, deadline and metadata when creating the escrow
 *
 */
contract ErasureNext_Escrow {

    using SafeMath for uint256;

    Escrow[] private escrows;

    struct Escrow {
        address tokenProvider;
        address dataProvider;
        address token;
        State status;
        uint256 amount;
        uint256 deadline;
        bytes metadata;
    }

    enum State { Created, Funded, Completed, Withdrawn }

    event EscrowCreated(uint256 escrowID, address tokenProvider, address dataProvider, address token, uint256 amount, uint256 deadline, bytes metadata);
    event FundsSubmitted(uint256 escrowID, address tokenProvider);
    event DataSubmitted(uint256 escrowID, address dataProvider, bytes data);
    event FundsWithdrawn(uint256 escrowID);

    // ESCROWS //

    function createEscrow(address tokenProvider, address dataProvider, address token, uint256 amount, uint256 deadline, bytes memory metadata) public returns (uint256 escrowID) {

        require(msg.sender == tokenProvider || msg.sender == dataProvider, "msg.sender must participate");

        escrowID = escrows.length;
        escrows.length++;
        Escrow storage escrow = escrows[escrowID];

        escrow.tokenProvider = tokenProvider;
        escrow.dataProvider = dataProvider;
        escrow.token = token;
        escrow.status = State.Created;
        escrow.amount = amount;
        escrow.deadline = deadline;
        escrow.metadata = metadata;

        emit EscrowCreated(escrowID, tokenProvider, dataProvider, token, amount, deadline, metadata);
    }

    function submitFunds(uint256 escrowID) public {

        Escrow storage escrow = escrows[escrowID];

        require(escrow.status == State.Created, "Must be in correct state");

        if (escrow.tokenProvider == address(0))
            escrow.tokenProvider = msg.sender;
        else
            require(msg.sender == escrow.tokenProvider, "msg.sender must be tokenProvider");

        escrow.status = State.Funded;

        require(IERC20(escrow.token).transferFrom(escrow.tokenProvider, address(this), escrow.amount));

        emit FundsSubmitted(escrowID, escrow.tokenProvider);
    }

    function submitData(uint256 escrowID, bytes memory data) public {

        Escrow storage escrow = escrows[escrowID];

        require(escrow.status == State.Funded, "Must be in correct state"); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        if (escrow.dataProvider == address(0))
            escrow.dataProvider = msg.sender;
        else
            require(msg.sender == escrow.dataProvider, "msg.sender must be dataProvider");

        require(block.timestamp < escrow.deadline); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        escrow.status = State.Completed;

        require(IERC20(escrow.token).transfer(escrow.dataProvider, escrow.amount)); // Not suceptible to re-entrancy due to update to escrow.status

        emit DataSubmitted(escrowID, escrow.dataProvider, data);
    }

    function withdrawFunds(uint256 escrowID) public returns (uint256 amount) {

        Escrow storage escrow = escrows[escrowID];
        amount = escrow.amount;

        require(escrow.status == State.Funded, "Must be in correct state");

        require(msg.sender == escrow.tokenProvider);
        require(block.timestamp >= escrow.deadline);

        escrow.status = State.Withdrawn;

        require(IERC20(escrow.token).transfer(escrow.tokenProvider, amount)); // Not suceptible to re-entrancy due to update to escrow.status

        emit FundsWithdrawn(escrowID);
    }

    function createAndFund(address dataProvider, address token, uint256 amount, uint256 deadline, bytes memory metadata) public returns (uint256 escrowID) {
        escrowID = createEscrow(msg.sender, dataProvider, token, amount, deadline, metadata);
        submitFunds(escrowID);
    }

    // Getters //

    function getEscrow(uint256 escrowID) public view returns (
        address tokenProvider,
        address dataProvider,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata,
        State status
    ) {
        tokenProvider = escrows[escrowID].tokenProvider;
        dataProvider = escrows[escrowID].dataProvider;
        token = escrows[escrowID].token;
        amount = escrows[escrowID].amount;
        deadline = escrows[escrowID].deadline;
        metadata = escrows[escrowID].metadata;
        status = escrows[escrowID].status;
    }

    function getTokenProvider(uint256 escrowID) public view returns (address tokenProvider) {
        tokenProvider = escrows[escrowID].tokenProvider;
    }

    function getDataProvider(uint256 escrowID) public view returns (address dataProvider) {
        dataProvider = escrows[escrowID].dataProvider;
    }

    function getToken(uint256 escrowID) public view returns (address token) {
        token = escrows[escrowID].token;
    }

    function getAmount(uint256 escrowID) public view returns (uint256 amount) {
        amount = escrows[escrowID].amount;
    }

    function getDeadline(uint256 escrowID) public view returns (uint256 deadline) {
        deadline = escrows[escrowID].deadline;
    }

    function getMetadata(uint256 escrowID) public view returns (bytes memory metadata) {
        metadata = escrows[escrowID].metadata;
    }

    function getStatus(uint256 escrowID) public view returns (State status) {
        status = escrows[escrowID].status;
    }

}
