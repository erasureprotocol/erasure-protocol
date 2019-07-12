pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../helpers/HitchensUnorderedAddressSet.sol";
import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";
import "../helpers/openzeppelin-solidity/cryptography/ECDSA.sol";


contract MultiPartyGriefing_ABIv2 {

    using SafeMath for uint256;
    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;

    address public token;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }
    enum State { Pending, Accepted, Ended }

    uint256 public griefDeadline;
    bytes public metadata;
    mapping (address => Party) public parties;
    HitchensUnorderedAddressSetLib.Set partyList;
    State public status;

    struct Party {
        uint256 stake;
        State status;
        mapping (address => GriefSetup) griefSetup;
    }

    struct GriefSetup {
        uint256 griefCostToPunishment;
        GriefType griefType;
    }

    constructor(address _token) public {
        token = _token;
    }

    function proposeAgreement(bytes memory agreementData, bytes memory partyData) public {

        (
            uint256 _griefDeadline,
            bytes memory _metadata
        ) = abi.decode(agreementData, (uint256, bytes));

        griefDeadline = _griefDeadline;
        metadata = _metadata;

        (
            address[] memory party,
            uint256[] memory stake,
            bytes[] memory griefData,
            bytes[] memory signature
        ) = abi.decode(partyData, (address[], uint256[], bytes[], bytes[]));

        require(party.length == stake.length, "encoded data length wrong");
        require(party.length == griefData.length, "encoded data length wrong");
        require(party.length == signature.length, "encoded data length wrong");

        for (uint i = 0; i < party.length; i++) {

            parties[party[i]].stake = stake[i];
            parties[party[i]].status = State.Pending;
            partyList.insert(party[i]); // reverts if party == address(0)

            if (signature[i].length != 0) {
                require(
                    party[i] == ECDSA.recover(
                        ECDSA.toEthSignedMessageHash(keccak256(abi.encode(stake[i], griefData[i]))),
                        signature[i]
                    ),
                "signed data invalid");

                _acceptProposal(party[i]);

            }

            (
                address[] memory counterparties,
                uint256[] memory griefCostToPunishment,
                GriefType[] memory griefType
            ) = abi.decode(griefData[i], (address[], uint256[], GriefType[]));

            for (uint g = 0; g < counterparties.length; g++) {

                parties[party[i]].griefSetup[counterparties[g]].griefCostToPunishment = griefCostToPunishment[g];
                parties[party[i]].griefSetup[counterparties[g]].griefType = griefType[g];

            }

        }
    }

    function _acceptProposal(address party) internal {
        require(parties[party].status == State.Pending, "incorrect state");

        parties[party].status = State.Accepted;

        require(IERC20(token).transferFrom(party, address(this), parties[party].stake), "token transfer failed");
    }

}
