pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../helpers/HitchensUnorderedAddressSetLib.sol";
import "../agreements/MultiPartyGriefing.sol";
import "../agreements/MultiPartyGriefing_Factory.sol";
import "../escrows/DataEscrow_Factory.sol";
import "../escrows/DataEscrow.sol";

// allow a specific counterparty to sign and activate the agreement using stake and payment escrows

contract EscrowedClosedAgreement {

    using SafeMath for uint256;
    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;

    mapping (address => Data) public agreements; // indexed by the agreement address
    HitchensUnorderedAddressSetLib.Set agreementSet;

    struct Data {
        address buyer;
        address buyerEscrow;
        address seller;
        address sellerEscrow;
    }

    Params public params;
    struct Params {
        address agreementFactory;
        address escrowFactory;
    }

    constructor(address agreementFactory, address escrowFactory) public {
        params.agreementFactory = agreementFactory;
        params.escrowFactory = escrowFactory;
    }

    modifier onlySeller(address agreement) {
        require(msg.sender == agreements[agreement].seller, "only seller");
        _;
    }

    modifier onlyBuyer(address agreement) {
        require(msg.sender == agreements[agreement].buyer, "only buyer");
        _;
    }

    modifier onlyBuyerOrSeller(address agreement) {
        require(msg.sender == agreements[agreement].buyer || msg.sender == agreements[agreement].seller, "only buyer or seller");
        _;
    }

    /////////////////////
    // Seller Proposed //
    /////////////////////

    function create(
        address buyer,
        address token,
        uint256 griefDeadline,
        uint256 escrowDeadline,
        bytes memory metadata,
        uint256 sellerStake,
        uint256 buyerStake,
        uint256 price,
        bytes memory sellerGriefParams,
        bytes memory buyerGriefParams
    ) public returns (address agreement, address sellerEscrow, address buyerEscrow) {

        // create the agreement
        agreement = MultiPartyGriefing_Factory(params.agreementFactory).createExplicit(address(this), token, true, griefDeadline, metadata);

        // add seller to agreement
        MultiPartyGriefing(agreement).addParty(msg.sender, sellerStake, sellerGriefParams);

        // add buyer to agreement
        MultiPartyGriefing(agreement).addParty(buyer, buyerStake, buyerGriefParams);

        // seal agreement
        MultiPartyGriefing(agreement).seal();

        // create seller escrow
        sellerEscrow = DataEscrow_Factory(params.escrowFactory).createExplicit(
            address(this),
            address(this),
            token,
            sellerStake,
            escrowDeadline,
            metadata
        );

        // create buyer escrow
        buyerEscrow = DataEscrow_Factory(params.escrowFactory).createExplicit(
            address(this),
            address(this),
            token,
            price,
            escrowDeadline,
            metadata
        );

        // add agreement to registry
        Data storage data = agreements[agreement];
        data.buyer = buyer;
        data.seller = msg.sender;
        data.sellerEscrow = sellerEscrow;
        data.buyerEscrow = buyerEscrow;

        agreementSet.insert(agreement);

        // fund seller escrow
        require(IERC20(token).transferFrom(msg.sender, address(this), sellerStake), 'transfer failed');
        require(IERC20(token).approve(sellerEscrow, sellerStake), 'apporval failed');
        DataEscrow(sellerEscrow).submitFunds();
    }

    function accept(address agreement) public onlyBuyer(agreement) {
        require(agreementSet.exists(agreement), 'agreement not registered');
        Data storage data = agreements[agreement];
        address token = MultiPartyGriefing(agreement).getToken();

        // get tokens from buyer for stake + price
        uint256 buyerStake = MultiPartyGriefing(agreement).getStake(data.buyer);
        uint256 price = DataEscrow(data.buyerEscrow).getAmount();
        require(IERC20(token).transferFrom(data.buyer, address(this), price.add(buyerStake)), 'transfer failed');

        // sign buyer agreement
        require(IERC20(token).approve(agreement, buyerStake), 'approval failed');
        MultiPartyGriefing(agreement).sign(data.buyer);

        // fund buyer escrow
        require(IERC20(token).approve(data.buyerEscrow, price), 'approval failed');
        DataEscrow(data.buyerEscrow).submitFunds();
    }

    // Note, if this function reverts, the data is leaked without payment
    function submitData(address agreement, bytes memory encryptedData) public onlySeller(agreement) {
        require(agreementSet.exists(agreement), 'agreement not registered');
        Data storage data = agreements[agreement];
        address token = MultiPartyGriefing(agreement).getToken();

        // close seller escrow
        uint256 sellerStake = DataEscrow(data.sellerEscrow).submitData(encryptedData);

        // sign seller agreement
        require(IERC20(token).approve(agreement, sellerStake), 'approval failed');
        MultiPartyGriefing(agreement).sign(data.seller);

        // close buyer escrow
        bytes memory emptyBytes;
        uint256 price = DataEscrow(data.buyerEscrow).submitData(emptyBytes);

        // transfer price to seller
        require(IERC20(token).transfer(data.seller, price), 'transfer failed');
    }

    /* Aborts a pending agreement after escrowDeadline but before submitData() is called.
     * - If after create() && before accept() -> return seller stake
     * - If after accept() && before submitData() -> return seller stake, buyer stake, buyer payment
     */
    function abort(address agreement) public onlyBuyerOrSeller(agreement) {
        require(agreementSet.exists(agreement), 'agreement not registered');
        Data storage data = agreements[agreement];
        address token = MultiPartyGriefing(agreement).getToken();

        // return stake to seller
        uint256 sellerStake = DataEscrow(data.sellerEscrow).withdrawFunds();
        require(IERC20(token).transfer(data.seller, sellerStake), 'transfer failed');

        // cancel the agreement. If in signing phase, will return buyer stake.
        uint256 buyerStake = MultiPartyGriefing(agreement).abort(msg.sender);

        // return stake and price to buyer
        if (buyerStake > 0) {
            uint256 price = DataEscrow(data.buyerEscrow).withdrawFunds();
            uint256 buyerAmount = price.add(buyerStake);
            require(IERC20(token).transfer(data.buyer, buyerAmount), 'transfer failed');
        }
    }

    ////////////////////
    // Buyer Proposed //
    ////////////////////

}
