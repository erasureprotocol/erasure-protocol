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
        uint256 price;
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
        uint256 price,
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
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) public returns (uint256 agreementID){

        if (isBuyer) {
            agreementID = pushProposal(
                metadata,
                msg.sender,
                counterparty,
                isBuyer,
                price,
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
                price,
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

    function pushProposal(
        bytes memory metadata,
        address buyer,
        address seller,
        bool isBuyer,
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) private returns (uint256 agreementID) {

        agreementID = agreements.length;

        agreements.push(Agreement(
            metadata,
            buyer,
            seller,
            isBuyer,
            price,
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
            price,
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
            require(msg.sender == agreement.buyer, "only seller");

        require(agreement.status == State.Pending, "only pending");

        // transfer price
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer, agreement.seller, agreement.price));

        // transfer stakes
        require(ERC20Burnable(nmr).transferFrom(agreement.seller, address(this), agreement.sellerStake));
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer, address(this), agreement.buyerStake));

        agreement.status = State.Accepted;

        emit AgreementAccepted(agreementID);
    }

    function griefAgreement(uint256 agreementID, uint256 punishment, bytes memory message) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(now < agreement.griefDeadline, "only before grief deadline");
        require(agreement.status == State.Accepted, "only accepted agreements");

        uint256 cost;

        if (msg.sender == agreement.seller) {
            cost = getGriefCost(agreement.sellerGriefCost, punishment, agreement.sellerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(cost);
            agreement.buyerStake = agreement.buyerStake.sub(punishment);
        } else {
            cost = getGriefCost(agreement.buyerGriefCost, punishment, agreement.buyerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(punishment);
            agreement.buyerStake = agreement.buyerStake.sub(cost);
        }

        ERC20Burnable(nmr).burn(punishment.add(cost));

        emit AgreementGriefed(agreementID, msg.sender, cost, punishment, message);
    }

    function endAgreement(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(agreement.status != State.Ended, "only active agreements");

        if (agreement.status == State.Accepted) {
            require(now > agreement.griefDeadline, "only after grief deadline");

            // not vulnerable to re-entrancy since token contract is trusted
            require(ERC20Burnable(nmr).transfer(agreement.seller, agreement.sellerStake));
            require(ERC20Burnable(nmr).transfer(agreement.buyer, agreement.buyerStake));

            delete agreement.sellerStake;
            delete agreement.buyerStake;
        } else {
            require(agreement.status == State.Pending, "only pending agreements");
        }

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

}
