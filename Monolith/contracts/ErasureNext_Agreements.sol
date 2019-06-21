pragma solidity ^0.5.0;

import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract ErasureNext_Agreements {

    using SafeMath for uint256;

    Agreement[] private agreements;

    address public nmr;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }
    enum State { Pending, Accepted, Ended }

    struct Agreement {
        uint256 griefDeadline;
        State status;
        bool buyerProposed;
        Party buyer;
        Party seller;
        bytes metadata;
    }

    struct Party {
        address wallet;
        uint256 stake;
        uint256 griefCostToPunishment;
        GriefType griefType;
    }

    event AgreementProposed(uint256 id, uint256 griefDeadline, bool buyerProposed, bytes metadata);
    event BuyerAdded(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType);
    event SellerAdded(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType);
    event AgreementAccepted(uint256 id);
    event AgreementGriefed(uint256 id, address griefer, uint256 cost, uint256 punishment, bytes message);
    event AgreementEnded(uint256 id);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // Modifiers //

    modifier onlySeller(uint256 id) {
        require(msg.sender == agreements[id].seller.wallet, "only seller");
        _;
    }

    modifier onlyBuyer(uint256 id) {
        require(msg.sender == agreements[id].buyer.wallet, "only buyer");
        _;
    }

    modifier onlyParticipant(uint256 id) {
        require(msg.sender == agreements[id].buyer.wallet || msg.sender == agreements[id].seller.wallet, "only participant");
        _;
    }

    /* modifier onlyState(uint256 id, State status) {
        require(agreement.status == status, "wrong state");
        _;
    } */

    // AGREEMENTS //

    function proposeAgreement(
        bool isBuyer,
        address counterparty,
        bytes memory metadata,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) public returns (uint256 id) {
        if (isBuyer) {
            id = partialProposal(
                isBuyer,
                griefDeadline,
                metadata,
                buyerStake,
                buyerGriefCost,
                buyerGriefType
            );
            addSeller(id, counterparty, sellerStake, sellerGriefCost, sellerGriefType);
        } else {
            id = partialProposal(
                isBuyer,
                griefDeadline,
                metadata,
                sellerStake,
                sellerGriefCost,
                sellerGriefType
            );
            addBuyer(id, counterparty, buyerStake, buyerGriefCost, buyerGriefType);
        }
    }

    function partialProposal(
        bool isBuyer,
        uint256 griefDeadline,
        bytes memory metadata,
        uint256 stake,
        uint256 griefCostToPunishment,
        GriefType griefType
    ) public returns (uint256 id) {

        id = agreements.length;
        agreements.length++;

        agreements[id].griefDeadline = griefDeadline;
        agreements[id].status = State.Pending;
        agreements[id].buyerProposed = isBuyer;
        agreements[id].metadata = metadata;

        if (isBuyer) {
            _addBuyer(id, msg.sender, stake, griefCostToPunishment, griefType);
        } else {
            _addSeller(id, msg.sender, stake, griefCostToPunishment, griefType);
        }

        emit AgreementProposed(id, griefDeadline, isBuyer, metadata);
    }

    function addSeller(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType) public onlyBuyer(id) {

        Agreement storage agreement = agreements[id];

        require(address(0) == agreement.seller.wallet, "no seller");
        /* require(agreement.status == State.Pending, "only pending"); */

        _addSeller(id, wallet, stake, griefCostToPunishment, griefType);
    }

    function addBuyer(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType) public onlySeller(id) {

        Agreement storage agreement = agreements[id];

        require(address(0) == agreement.buyer.wallet, "no buyer");
        /* require(agreement.status == State.Pending, "only pending"); */

        _addBuyer(id, wallet, stake, griefCostToPunishment, griefType);
    }

    function _addSeller(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType) public {

        Agreement storage agreement = agreements[id];

        agreement.seller.wallet = wallet;
        agreement.seller.stake = stake;
        agreement.seller.griefCostToPunishment = griefCostToPunishment;
        agreement.seller.griefType = griefType;

        emit SellerAdded(id, wallet, stake, griefCostToPunishment, griefType);
    }

    function _addBuyer(uint256 id, address wallet, uint256 stake, uint256 griefCostToPunishment, GriefType griefType) public {

        Agreement storage agreement = agreements[id];

        agreement.buyer.wallet = wallet;
        agreement.buyer.stake = stake;
        agreement.buyer.griefCostToPunishment = griefCostToPunishment;
        agreement.buyer.griefType = griefType;

        emit BuyerAdded(id, wallet, stake, griefCostToPunishment, griefType);
    }

    function acceptAgreement(uint256 id) public {

        Agreement storage agreement = agreements[id];

        if (agreement.buyerProposed)
            require(msg.sender == agreement.seller.wallet, "only seller");
        else
            require(msg.sender == agreement.buyer.wallet, "only buyer");

        require(agreement.status == State.Pending, "only pending");
        require(validateGriefParams(agreement.buyer.griefType, agreement.seller.stake, agreement.buyer.griefCostToPunishment), "buyer grief type invalid");
        require(validateGriefParams(agreement.seller.griefType, agreement.buyer.stake, agreement.seller.griefCostToPunishment), "seller grief type invalid");
        require(validateDeadline(agreement.buyer.griefType, agreement.seller.griefType, agreement.griefDeadline), "griefDeadline invalid");

        // transfer stakes
        require(ERC20Burnable(nmr).transferFrom(agreement.seller.wallet, address(this), agreement.seller.stake));
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer.wallet, address(this), agreement.buyer.stake));

        agreement.status = State.Accepted;

        emit AgreementAccepted(id);
    }

    function griefSeller(uint256 id, uint256 punishment, bytes memory message) public onlyBuyer(id) {

        Agreement storage agreement = agreements[id];

        require(now < agreement.griefDeadline, "only before grief deadline");
        require(agreement.status == State.Accepted, "only accepted agreements");

        uint256 cost = getGriefCost(agreement.buyer.griefCostToPunishment, punishment, agreement.buyer.griefType);
        agreement.seller.stake = agreement.seller.stake.sub(punishment);

        ERC20Burnable(nmr).burn(punishment);
        ERC20Burnable(nmr).burnFrom(msg.sender, cost);

        emit AgreementGriefed(id, msg.sender, cost, punishment, message);
    }

    function griefBuyer(uint256 id, uint256 punishment, bytes memory message) public onlySeller(id) {

        Agreement storage agreement = agreements[id];

        require(now < agreement.griefDeadline, "only before grief deadline");
        require(agreement.status == State.Accepted, "only accepted agreements");

        uint256 cost = getGriefCost(agreement.seller.griefCostToPunishment, punishment, agreement.seller.griefType);
        agreement.buyer.stake = agreement.buyer.stake.sub(punishment);

        ERC20Burnable(nmr).burn(punishment);
        ERC20Burnable(nmr).burnFrom(msg.sender, cost);

        emit AgreementGriefed(id, msg.sender, cost, punishment, message);
    }

    function cancelProposal(uint256 id) public onlyParticipant(id) {

        Agreement storage agreement = agreements[id];

        require(agreement.status == State.Pending, "only pending agreements");

        agreement.status = State.Ended;

        emit AgreementEnded(id);
    }

    function endAgreement(uint256 id) public onlyParticipant(id) {

        Agreement storage agreement = agreements[id];

        require(agreement.status == State.Accepted, "only accepted agreements");
        require(now > agreement.griefDeadline, "only after grief deadline");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transfer(agreement.seller.wallet, agreement.seller.stake));
        require(ERC20Burnable(nmr).transfer(agreement.buyer.wallet, agreement.buyer.stake));

        delete agreement.seller.stake;
        delete agreement.buyer.stake;

        agreement.status = State.Ended;

        emit AgreementEnded(id);
    }

    // Validation //

    function validateGriefParams(GriefType griefType, uint256 stake, uint256 ratio) private pure returns (bool valid) {
        if (griefType == GriefType.CgtP || griefType == GriefType.CltP)
            return (stake > 0 && ratio > 1);
        if (griefType == GriefType.CeqP)
            return (stake > 0 && ratio == 1);
        if (griefType == GriefType.InfGreif)
            return (stake > 0 && ratio == 0);
        if (griefType == GriefType.NoGreif)
            return (stake == 0 && ratio == 0);
        else
            return false;
    }

    function validateDeadline(GriefType buyerType, GriefType sellerType, uint256 griefDeadline) private view returns (bool valid) {
        if (buyerType == GriefType.NoGreif && sellerType == GriefType.NoGreif)
            return (griefDeadline == 0);
        else
            return (griefDeadline > block.timestamp);
    }

    // Getters //

    function getGriefCost(uint256 ratio, uint256 punishment, GriefType griefType) public pure returns(uint256 cost) {
        /*
            CgtP: Cost greater than Punishment
            CltP: Cost less than Punishment
            CeqP: Cost equal to Punishment
            InfGrief: Punishment at no cost
            NoGrief: No Punishment
        */
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

    function getAgreement(uint256 id) public view returns (
        uint256 griefDeadline,
        State status,
        bool buyerProposed,
        bytes memory metadata
    ) {

        Agreement storage agreement = agreements[id];

        griefDeadline = agreement.griefDeadline;
        status = agreement.status;
        buyerProposed = agreement.buyerProposed;
        metadata = agreement.metadata;
    }

    function getBuyer(uint256 id) public view returns (
        address wallet,
        uint256 stake,
        uint256 griefCostToPunishment,
        GriefType griefType
    ) {
        Party storage party = agreements[id].buyer;

        wallet = party.wallet;
        stake = party.stake;
        griefCostToPunishment = party.griefCostToPunishment;
        griefType = party.griefType;
    }

    function getSeller(uint256 id) public view returns (
        address wallet,
        uint256 stake,
        uint256 griefCostToPunishment,
        GriefType griefType
    ) {
        Party storage party = agreements[id].seller;

        wallet = party.wallet;
        stake = party.stake;
        griefCostToPunishment = party.griefCostToPunishment;
        griefType = party.griefType;
    }

}
