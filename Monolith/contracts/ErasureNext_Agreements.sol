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
        bytes metadata;
        address buyer;
        address seller;
        bool buyerProposed;
        uint256 buyerStake;
        uint256 sellerStake;
        uint256 buyerGriefCost;
        uint256 sellerGriefCost;
        uint256 griefDeadline;
        GriefType buyerGriefType;
        GriefType sellerGriefType;
        State status;
    }

    event AgreementProposed(
        uint256 agreementID,
        bytes metadata,
        address buyer,
        address seller,
        bool buyerProposed,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    );
    event AgreementAccepted(uint256 agreementID);
    event AgreementGriefed(uint256 agreementID, address griefer, uint256 cost, uint256 punishment, bytes message);
    event AgreementEnded(uint256 agreementID);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

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
    ) public returns (uint256 agreementID) {

        if (isBuyer) {
            agreementID = pushProposal(
                metadata,
                msg.sender,
                counterparty,
                isBuyer,
                buyerStake,
                sellerStake,
                buyerGriefCost,
                sellerGriefCost,
                griefDeadline,
                buyerGriefType,
                sellerGriefType
            );
        } else {
            agreementID = pushProposal(
                metadata,
                counterparty,
                msg.sender,
                isBuyer,
                buyerStake,
                sellerStake,
                buyerGriefCost,
                sellerGriefCost,
                griefDeadline,
                buyerGriefType,
                sellerGriefType
            );
        }
    }

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

    function pushProposal(
        bytes memory metadata,
        address buyer,
        address seller,
        bool isBuyer,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) private returns (uint256 agreementID) {

        require(validateGriefParams(buyerGriefType, sellerStake, buyerGriefCost), "buyer grief type invalid");
        require(validateGriefParams(sellerGriefType, buyerStake, sellerGriefCost), "seller grief type invalid");
        require(validateDeadline(buyerGriefType, sellerGriefType, griefDeadline), "griefDeadline invalid");
        require(buyer != seller, "cannot make agreement with self");

        agreementID = agreements.length;

        agreements.push(Agreement(
            metadata,
            buyer,
            seller,
            isBuyer,
            buyerStake,
            sellerStake,
            buyerGriefCost,
            sellerGriefCost,
            griefDeadline,
            buyerGriefType,
            sellerGriefType,
            State.Pending
        ));

        emit AgreementProposed(
            agreementID,
            metadata,
            buyer,
            seller,
            isBuyer,
            buyerStake,
            sellerStake,
            buyerGriefCost,
            sellerGriefCost,
            griefDeadline,
            buyerGriefType,
            sellerGriefType
        );
    }

    function acceptAgreement(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        if (agreement.buyerProposed)
            require(msg.sender == agreement.seller, "only seller");
        else
            require(msg.sender == agreement.buyer, "only buyer");

        require(agreement.status == State.Pending, "only pending");
        require(validateDeadline(agreement.buyerGriefType, agreement.sellerGriefType, agreement.griefDeadline), "griefDeadline invalid");

        // transfer stakes
        require(ERC20Burnable(nmr).transferFrom(agreement.seller, address(this), agreement.sellerStake));
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer, address(this), agreement.buyerStake));

        agreement.status = State.Accepted;

        emit AgreementAccepted(agreementID);
    }

    function griefSeller(uint256 agreementID, uint256 punishment, bytes memory message) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.buyer, "only buyer");
        require(now < agreement.griefDeadline, "only before grief deadline");
        require(agreement.status == State.Accepted, "only accepted agreements");

        uint256 cost = getGriefCost(agreement.buyerGriefCost, punishment, agreement.buyerGriefType);
        agreement.sellerStake = agreement.sellerStake.sub(punishment);

        ERC20Burnable(nmr).burn(punishment);
        ERC20Burnable(nmr).burnFrom(msg.sender, cost);

        emit AgreementGriefed(agreementID, msg.sender, cost, punishment, message);
    }

    function griefBuyer(uint256 agreementID, uint256 punishment, bytes memory message) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller, "only seller");
        require(now < agreement.griefDeadline, "only before grief deadline");
        require(agreement.status == State.Accepted, "only accepted agreements");

        uint256 cost = getGriefCost(agreement.sellerGriefCost, punishment, agreement.sellerGriefType);
        agreement.buyerStake = agreement.buyerStake.sub(punishment);

        ERC20Burnable(nmr).burn(punishment);
        ERC20Burnable(nmr).burnFrom(msg.sender, cost);

        emit AgreementGriefed(agreementID, msg.sender, cost, punishment, message);
    }

    function cancelProposal(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(agreement.status == State.Pending, "only pending agreements");

        agreement.status = State.Ended;

        emit AgreementEnded(agreementID);
    }

    function endAgreement(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(agreement.status == State.Accepted, "only accepted agreements");
        require(now > agreement.griefDeadline, "only after grief deadline");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transfer(agreement.seller, agreement.sellerStake));
        require(ERC20Burnable(nmr).transfer(agreement.buyer, agreement.buyerStake));

        delete agreement.sellerStake;
        delete agreement.buyerStake;

        agreement.status = State.Ended;

        emit AgreementEnded(agreementID);
    }

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

    function getAgreement(uint256 agreementID) public view returns (
        bytes memory metadata,
        address buyer,
        address seller,
        bool buyerProposed,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType,
        State status
    ) {

        Agreement storage agreement = agreements[agreementID];

        metadata = agreement.metadata;
        buyer = agreement.buyer;
        seller = agreement.seller;
        buyerProposed = agreement.buyerProposed;
        buyerStake = agreement.buyerStake;
        sellerStake = agreement.sellerStake;
        buyerGriefCost = agreement.buyerGriefCost;
        sellerGriefCost = agreement.sellerGriefCost;
        griefDeadline = agreement.griefDeadline;
        buyerGriefType = agreement.buyerGriefType;
        sellerGriefType = agreement.sellerGriefType;
        status = agreement.status;
    }

}
