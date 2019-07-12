pragma solidity ^0.5.0;

import "../helpers/HitchensUnorderedAddressSet.sol";
import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract MultiPartyGriefing {

    using SafeMath for uint256;
    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }
    enum Status { Initialized, Sealed, Signed, Ended }

    address public token;
    address public creator;
    uint256 public griefDeadline;
    uint256 public numSigned;
    bytes public metadata;
    Status public status;

    mapping (address => Party) public parties;
    HitchensUnorderedAddressSetLib.Set partyList;

    struct Party {
        uint256 stake;
        bool signed;
        mapping (address => GriefParams) griefParams;
    }

    struct GriefParams {
        uint256 griefCostToPunishment;
        GriefType griefType;
    }

    event PartyAdded(address indexed party, uint256 stake, bytes griefParams);
    event Sealed(uint256 parties);
    event Signed(address indexed party, uint256 remaining);
    event Griefed(address indexed party, address indexed counterparty, uint256 punishment, uint256 cost, bytes message);
    event Ended(address indexed by, bool indexed accepted);
    event StakeRecovered(address indexed party, uint256 amount);

    constructor(address _token, address _creator, uint256 _griefDeadline, bytes memory _metadata) public {
        token = _token;
        creator = _creator;
        griefDeadline = _griefDeadline;
        metadata = _metadata;
        status = Status.Initialized;
    }

    // Initialized

    function addParty(address party, uint256 stake, bytes memory griefParams) public {
        require(msg.sender == creator, "only creator");
        require(status == Status.Initialized, "invalid agreement state");

        parties[party].stake = stake;
        partyList.insert(party); // reverts if party == address(0)

        (
            address[] memory counterparties,
            uint256[] memory griefCostToPunishment,
            GriefType[] memory griefType
        ) = abi.decode(griefParams, (address[], uint256[], GriefType[]));

        for (uint g = 0; g < counterparties.length; g++) {
            /* require(partyList.exists(counterparties[g]), "counterparty must be added"); */ // should be okay to add random other address
            parties[party].griefParams[counterparties[g]].griefCostToPunishment = griefCostToPunishment[g];
            parties[party].griefParams[counterparties[g]].griefType = griefType[g];
        }

        emit PartyAdded(party, stake, griefParams);
    }

    function sealProposal() public {
        require(msg.sender == creator, "only creator");
        require(status == Status.Initialized, "invalid agreement state");

        status = Status.Sealed;

        emit Sealed(partyList.count());
    }

    /* function acceptAgreement(address party, bytes memory signature) public {
        require(
            party == ECDSA.recover(
                ECDSA.toEthSignedMessageHash(keccak256(abi.encode(parties[party].stake, griefParams, address(this)))),
                signature
            ),
        "party must match signature");

        _acceptAgreement(party);
    } */

    // Sealed

    function signAgreement() public {

        require(status == Status.Sealed, "invalid agreement state");

        address party = msg.sender;

        require(partyList.exists(party), "only party");
        require(parties[party].signed == false, "invalid party state");

        parties[party].signed = true;
        numSigned = numSigned.add(1);

        require(IERC20(token).transferFrom(party, address(this), parties[party].stake), "token transfer failed");

        if (numSigned == partyList.count())
            status = Status.Signed;

        emit Signed(party, partyList.count().sub(numSigned));
    }

    function cancelAgreement() public {

        require(status == Status.Initialized || status == Status.Sealed, "invalid agreement state");
        require(partyList.exists(msg.sender) || msg.sender == creator, "only party or creator");

        status = Status.Ended;

        emit Ended(msg.sender, false);
    }

    // Signed

    function grief(address counterparty, uint256 punishment, bytes memory message) public {

        require(status == Status.Signed, "invalid agreement state");
        require(now < griefDeadline, "only before grief deadline");

        address party = msg.sender;

        require(partyList.exists(party), "only party");

        GriefParams memory griefParams = parties[party].griefParams[counterparty];

        uint256 cost = getGriefCost(griefParams.griefCostToPunishment, punishment, griefParams.griefType);

        parties[counterparty].stake = parties[counterparty].stake.sub(punishment);

        ERC20Burnable(token).burn(punishment);
        ERC20Burnable(token).burnFrom(party, cost);

        emit Griefed(party, counterparty, punishment, cost, message);
    }

    // Ended

    function recoverStake() public {

        address party = msg.sender;

        if (status == Status.Signed) {
            require(now > griefDeadline, "only after grief deadline");
            status = Status.Ended;
            emit Ended(party, true);
        }

        require(status == Status.Ended, "invalid agreement state");

        require(partyList.exists(party), "only party");

        uint256 stake = parties[party].stake;

        // not vulnerable to re-entrancy since token contract is trusted
        require(IERC20(token).transfer(party, stake));

        delete parties[party].stake;

        emit StakeRecovered(party, stake);
    }

    // helpers

    function getGriefCost(uint256 ratio, uint256 punishment, GriefType griefType) public pure returns(uint256 cost) {
        /*  CgtP:     Cost greater than Punishment
         *  CltP:     Cost less than Punishment
         *  CeqP:     Cost equal to Punishment
         *  InfGrief: Punishment at no cost
         *  NoGrief:  No Punishment */
        if (griefType == GriefType.CgtP)
            return punishment.mul(ratio);
        if (griefType == GriefType.CltP)
            return punishment.div(ratio);
        if (griefType == GriefType.CeqP)
            return punishment;
        if (griefType == GriefType.InfGreif)
            return 0;
        if (griefType == GriefType.NoGreif)
            revert();
    }

}
