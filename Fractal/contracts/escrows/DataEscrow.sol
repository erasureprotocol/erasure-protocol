pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";


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
contract DataEscrow {

    using SafeMath for uint256;

    Escrow public escrow;

    enum Status { Created, Funded, Completed, Withdrawn }

    struct Escrow {
        address tokenProvider;
        address dataProvider;
        address token;
        Status status;
        uint256 amount;
        uint256 deadline;
        bytes metadata;
    }

    event EscrowCreated(address tokenProvider, address dataProvider, address token, uint256 amount, uint256 deadline, bytes metadata);
    event FundsSubmitted(address tokenProvider);
    event DataSubmitted(address dataProvider, bytes data);
    event FundsWithdrawn();

    // ESCROWS //

    constructor(address tokenProvider, address dataProvider, address token, uint256 amount, uint256 deadline, bytes memory metadata) public {

        require(msg.sender == tokenProvider || msg.sender == dataProvider, "msg.sender must participate");

        escrow.tokenProvider = tokenProvider;
        escrow.dataProvider = dataProvider;
        escrow.token = token;
        escrow.status = Status.Created;
        escrow.amount = amount;
        escrow.deadline = deadline;
        escrow.metadata = metadata;

        emit EscrowCreated(tokenProvider, dataProvider, token, amount, deadline, metadata);
    }

    function submitFunds() public {
        require(escrow.status == Status.Created, "Must be in correct state");

        if (escrow.tokenProvider == address(0))
            escrow.tokenProvider = msg.sender;
        else
            require(msg.sender == escrow.tokenProvider, "msg.sender must be tokenProvider");

        escrow.status = Status.Funded;

        require(IERC20(escrow.token).transferFrom(escrow.tokenProvider, address(this), escrow.amount));

        emit FundsSubmitted(escrow.tokenProvider);
    }

    function submitData(bytes memory data) public returns (uint256 amount) {
        require(escrow.status == Status.Funded, "Must be in correct state"); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        if (escrow.dataProvider == address(0))
            escrow.dataProvider = msg.sender;
        else
            require(msg.sender == escrow.dataProvider, "msg.sender must be dataProvider");

        require(block.timestamp < escrow.deadline); // This should be checked off-chain because if the tx fails, the data is revealed without a payment

        amount = escrow.amount;
        escrow.status = Status.Completed;

        require(IERC20(escrow.token).transfer(escrow.dataProvider, amount));

        emit DataSubmitted(escrow.dataProvider, data);
    }

    function withdrawFunds() public returns (uint256 amount) {
        require(escrow.status == Status.Funded, "Must be in correct state");

        require(msg.sender == escrow.tokenProvider);
        require(block.timestamp >= escrow.deadline);

        amount = escrow.amount;
        escrow.status = Status.Withdrawn;

        require(IERC20(escrow.token).transfer(escrow.tokenProvider, amount));

        emit FundsWithdrawn();
    }

    // Getters //

    function getEscrow() public view returns (
        address tokenProvider,
        address dataProvider,
        address token,
        uint256 amount,
        uint256 deadline,
        bytes memory metadata,
        Status status
    ) {
        tokenProvider = escrow.tokenProvider;
        dataProvider = escrow.dataProvider;
        token = escrow.token;
        amount = escrow.amount;
        deadline = escrow.deadline;
        metadata = escrow.metadata;
        status = escrow.status;
    }

    function getTokenProvider() public view returns (address tokenProvider) {
        tokenProvider = escrow.tokenProvider;
    }

    function getDataProvider() public view returns (address dataProvider) {
        dataProvider = escrow.dataProvider;
    }

    function getToken() public view returns (address token) {
        token = escrow.token;
    }

    function getAmount() public view returns (uint256 amount) {
        amount = escrow.amount;
    }

    function getDeadline() public view returns (uint256 deadline) {
        deadline = escrow.deadline;
    }

    function getMetadata() public view returns (bytes memory metadata) {
        metadata = escrow.metadata;
    }

    function getStatus() public view returns (Status status) {
        status = escrow.status;
    }

}
