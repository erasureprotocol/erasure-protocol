pragma solidity ^0.5.0;

import "../helpers/openzeppelin-eth/math/SafeMath.sol";
import "../helpers/openzeppelin-eth/token/ERC20/ERC20Burnable.sol";


contract SymmetricGriefing {

    using SafeMath for uint256;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }

    address public nmr;
    Agreement public agreement;

    struct Agreement {
        bytes metadata;
        address owner;
        uint256 stake;
    }

    event AgreementGriefed(address griefer, uint256 amount);
    event AgreementEnded();

    constructor(
        address _nmr,
        bytes memory metadata,
        address owner,
        uint256 stake
    ) public {
        nmr = _nmr;
        agreement = Agreement(
            metadata,
            owner,
            stake
        );
    }

    // known to be vulnerable to front-running
    function grief(uint256 amount) public {

        agreement.stake = agreement.stake.sub(amount);

        ERC20Burnable(nmr).burn(amount);
        ERC20Burnable(nmr).burnFrom(msg.sender, amount);

        emit AgreementGriefed(msg.sender, amount);
    }

    function end() public {

        require(msg.sender == agreement.owner, "only owner");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transfer(agreement.owner, agreement.stake));

        delete agreement.stake;

        emit AgreementEnded();
    }

}
