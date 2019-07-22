pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract Symmetric {

    using SafeMath for uint256;

    address public token;
    Agreement public agreement;

    struct Agreement {
        address owner;
        uint256 stake;
        uint256 deadline;
        bytes metadata;
    }

    event AgreementCreated(address owner, uint256 stake, uint256 deadline, bytes metadata);
    event AgreementGriefed(address griefer, uint256 amount);
    event AgreementEnded();

    constructor(
        address _token,
        address owner,
        uint256 stake,
        uint256 deadline,
        bytes memory metadata
    ) public {
        token = _token;
        require(ERC20Burnable(token).transferFrom(owner, address(this), stake));
        agreement = Agreement(owner, stake, deadline, metadata);
        emit AgreementCreated(owner, stake, deadline, metadata);
    }

    // known to be vulnerable to front-running
    function grief(uint256 amount) public {

        ERC20Burnable(token).burn(amount);
        ERC20Burnable(token).burnFrom(msg.sender, amount);

        agreement.stake = agreement.stake.sub(amount);

        emit AgreementGriefed(msg.sender, amount);
    }

    function end() public {

        require(msg.sender == agreement.owner, "only owner");
        require(block.timestamp >= agreement.deadline, "only after deadline");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(token).transfer(agreement.owner, agreement.stake));

        delete agreement.stake;

        emit AgreementEnded();
    }

}
