pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";


contract BasicEscrow {

    using SafeMath for uint256;

    Data public escrow;

    struct Data {
        address tokenProvider;
        address counterparty;
        address token;
        Status status;
        uint256 amount;
        bytes metadata;
    }

    enum Status { Created, Funded, Completed, Aborted }

    constructor(address tokenProvider, address counterparty, address token, uint256 amount, bytes memory metadata) public {
        require(msg.sender == tokenProvider || msg.sender == counterparty, "msg.sender must participate");

        escrow.tokenProvider = tokenProvider;
        escrow.counterparty = counterparty;
        escrow.token = token;
        escrow.status = Status.Created;
        escrow.amount = amount;
        escrow.metadata = metadata;
    }

    function submitFunds() public {
        require(escrow.status == Status.Created, "incorrect status");

        if (escrow.tokenProvider == address(0))
            escrow.tokenProvider = msg.sender;
        else
            require(msg.sender == escrow.tokenProvider, "msg.sender must be tokenProvider");

        escrow.status = Status.Funded;

        require(IERC20(escrow.token).transferFrom(escrow.tokenProvider, address(this), escrow.amount));
    }

    function takeFunds() public {
        require(escrow.status == Status.Funded, "incorrect status");

        if (escrow.counterparty == address(0))
            escrow.counterparty = msg.sender;
        else
            require(msg.sender == escrow.counterparty, "msg.sender must be counterparty");

        escrow.status = Status.Completed;

        require(IERC20(escrow.token).transfer(escrow.counterparty, escrow.amount));
    }

    function abort() public {
        require(escrow.status == Status.Created || escrow.status == Status.Funded, "incorrect status");
        require(msg.sender == escrow.tokenProvider || msg.sender == escrow.counterparty, "only participant");

        if (escrow.status == Status.Funded)
            require(IERC20(escrow.token).transfer(escrow.counterparty, escrow.amount));

        escrow.status = Status.Aborted;
    }
}
