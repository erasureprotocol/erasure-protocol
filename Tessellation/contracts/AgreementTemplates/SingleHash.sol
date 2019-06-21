pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract SingleHash {

    using SafeMath for uint256;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }

    address public nmr;
    Agreement public agreement;

    struct Agreement {
        bytes metadata;
        address buyer;
        address seller;
        uint256 price;
        uint256 buyerStake;
        uint256 sellerStake;
        uint256 buyerGriefRatio;
        uint256 sellerGriefRatio;
        uint256 griefDeadline;
        GriefType buyerGriefType;
        GriefType sellerGriefType;
    }

    event AgreementGriefed(address griefer, uint256 cost, uint256 punishment);
    event AgreementEnded();

    constructor(
        address _nmr,
        bytes memory metadata,
        address buyer,
        address seller,
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefRatio,
        uint256 sellerGriefRatio,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) public {
        nmr = _nmr;
        agreement = Agreement(
            metadata,
            buyer,
            seller,
            price,
            buyerStake,
            sellerStake,
            buyerGriefRatio,
            sellerGriefRatio,
            griefDeadline,
            buyerGriefType,
            sellerGriefType
        );
    }

    function grief(uint256 punishment) public {

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");

        uint256 cost;

        if (msg.sender == agreement.seller) {
            cost = getGriefCost(agreement.sellerGriefRatio, punishment, agreement.sellerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(cost);
            agreement.buyerStake = agreement.buyerStake.sub(punishment);
        } else {
            cost = getGriefCost(agreement.buyerGriefRatio, punishment, agreement.buyerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(punishment);
            agreement.buyerStake = agreement.buyerStake.sub(cost);
        }

        ERC20Burnable(nmr).burn(punishment.add(cost));

        emit AgreementGriefed(msg.sender, cost, punishment);
    }

    function endAgreement() public {

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(now > agreement.griefDeadline, "only after grief deadline");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transfer(agreement.seller, agreement.sellerStake));
        require(ERC20Burnable(nmr).transfer(agreement.buyer, agreement.buyerStake));

        delete agreement.sellerStake;
        delete agreement.buyerStake;

        emit AgreementEnded();
    }

    function getGriefCost(uint256 ratio, uint256 punishment, GriefType griefType) public pure returns(uint256 cost) {
        /*
            CgtP: Cost to buyer greater than Punishment to seller
            CltP: Cost to buyer less than Punishment to seller
            CeqP: Cost to buyer equal to Punishment to seller:
            InfGrief: Buyer can punish seller at no cost.
            NoGrief: Buyer cannot punish seller.
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
