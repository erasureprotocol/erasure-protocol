pragma solidity ^0.5.0;

import "../helpers/HitchensUnorderedAddressSetLib.sol";
import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/IERC20.sol";
import "../modules/BurnNMR.sol";
import "../helpers/openzeppelin-solidity/cryptography/ECDSA.sol";


contract MultiPartyGriefing is BurnNMR {

    using SafeMath for uint256;
    using HitchensUnorderedAddressSetLib for HitchensUnorderedAddressSetLib.Set;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }
    enum Status { Created, Sealed, Signed, Ended }

    Parameters public params;

    struct Parameters {
        address operator;
        bool trustedOperator; // allows for the operator to sign, grief, and recoverStake on behalf of users
        uint256 griefDeadline;
        uint256 numSigned;
        bytes metadata;
        Status status;
    }

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
    event Ended(address indexed by, bool indexed completed);
    event StakeRecovered(address indexed party, uint256 amount);

    function initialize(
        address operator,
        address token,
        bool trustedOperator,
        uint256 griefDeadline,
        bytes memory metadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        assembly { if extcodesize(address) { revert(0, 0) } }

        params.operator = operator;
        BurnNMR._setToken(token);
        params.trustedOperator = trustedOperator;
        params.griefDeadline = griefDeadline;
        params.metadata = metadata;
        params.status = Status.Created;
    }

    // Created

    function addParty(address party, uint256 stake, bytes memory griefParams) public {
        require(msg.sender == params.operator, "only operator");
        require(params.status == Status.Created, "invalid agreement state");

        parties[party].stake = stake;
        partyList.insert(party); // reverts if party == address(0) or already exists

        (
            address[] memory counterparties,
            uint256[] memory griefCostToPunishment,
            GriefType[] memory griefType
        ) = abi.decode(griefParams, (address[], uint256[], GriefType[]));

        for (uint g = 0; g < counterparties.length; g++) {
            /* require(partyList.exists(counterparties[g]), "counterparty must be added"); // should be okay to add random other address */
            parties[party].griefParams[counterparties[g]].griefCostToPunishment = griefCostToPunishment[g];
            parties[party].griefParams[counterparties[g]].griefType = griefType[g];
        }

        emit PartyAdded(party, stake, griefParams);
    }

    function seal() public {
        require(msg.sender == params.operator, "only operator");
        require(params.status == Status.Created, "invalid agreement state");

        params.status = Status.Sealed;

        emit Sealed(partyList.count());
    }

    // Sealed

    // Call with signed message
    function sign(bytes memory signature) public {
        address party = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(
                getSignSig()
            ),
            signature
        );
        require(party != address(0), 'check signature validity');

        _sign(party);
        // tokens are transfered from the party
        require(IERC20(BurnNMR.getToken()).transferFrom(party, address(this), parties[party].stake), "token transfer failed");
    }

    // Call from trusted operator
    function sign(address party) public {
        require(msg.sender == params.operator, "only operator");
        require(params.trustedOperator, "only trusted operator");

        _sign(party);
        // tokens are transfered from the operator
        require(IERC20(BurnNMR.getToken()).transferFrom(params.operator, address(this), parties[party].stake), "token transfer failed");
    }

    // Call from party address
    function sign() public {
        address party = msg.sender;

        _sign(party);
        // tokens are transfered from the party
        require(IERC20(BurnNMR.getToken()).transferFrom(party, address(this), parties[party].stake), "token transfer failed");
    }

    function _sign(address party) internal {
        require(params.status == Status.Sealed, "invalid agreement state");

        require(partyList.exists(party), "only party");
        require(parties[party].signed == false, "invalid party state");

        parties[party].signed = true;
        params.numSigned = params.numSigned.add(1);

        if (params.numSigned == partyList.count())
            params.status = Status.Signed;

        emit Signed(party, partyList.count().sub(params.numSigned));
    }

    // Signed

    // Call with signed message
    function grief(address counterparty, uint256 punishment, bytes memory message, bytes memory signature) public {
        address party = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(
                getGriefSig(counterparty, punishment, message)
            ),
            signature
        );
        require(party != address(0), 'check signature validity');

        uint256 cost = _grief(party, counterparty, punishment, message);
        // tokens are burned from the party
        BurnNMR._burnFrom(party, cost);
    }

    // Call from trusted operator
    function grief(address party, address counterparty, uint256 punishment, bytes memory message) public {
        require(msg.sender == params.operator, "only operator");
        require(params.trustedOperator, "only trusted operator");

        uint256 cost = _grief(party, counterparty, punishment, message);
        // tokens are burned from the operator
        BurnNMR._burnFrom(params.operator, cost);
    }

    // Call from party address
    function grief(address counterparty, uint256 punishment, bytes memory message) public {
        address party = msg.sender;

        uint256 cost = _grief(party, counterparty, punishment, message);
        // tokens are burned from the party
        BurnNMR._burnFrom(party, cost);
    }

    function _grief(address party, address counterparty, uint256 punishment, bytes memory message) internal returns (uint256 cost) {
        require(params.status == Status.Signed, "invalid agreement state");
        require(now < params.griefDeadline, "only before grief deadline");

        require(partyList.exists(party), "only party");
        require(partyList.exists(counterparty), "only party");

        GriefParams memory griefParams = parties[party].griefParams[counterparty];
        cost = getGriefCost(griefParams.griefCostToPunishment, punishment, griefParams.griefType);
        parties[counterparty].stake = parties[counterparty].stake.sub(punishment);

        emit Griefed(party, counterparty, punishment, cost, message);

        BurnNMR._burn(punishment);
    }

    // Ended

    function cancel() public {
        require(params.status == Status.Created || params.status == Status.Sealed, "invalid agreement state");
        require(partyList.exists(msg.sender) || msg.sender == params.operator, "only party or operator");

        params.status = Status.Ended;

        emit Ended(msg.sender, false);
    }

    // Call with signed message
    function abort(bytes memory signature) public returns (uint256 stake) {
        address party = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(
                getAbortSig()
            ),
            signature
        );
        require(party != address(0), 'check signature validity');

        stake = _abort(party);
        // transfer stake to party
        if (stake > 0)
            require(IERC20(BurnNMR.getToken()).transfer(party, stake));
    }

    // Call from trusted operator
    function abort(address party) public returns (uint256 stake) {
        require(msg.sender == params.operator, "only operator");
        require(params.trustedOperator, "only trusted operator");

        stake = _abort(party);
        // transfer stake to operator
        if (stake > 0)
            require(IERC20(BurnNMR.getToken()).transfer(params.operator, stake));
    }

    // Call from party address
    function abort() public returns (uint256 stake) {
        address party = msg.sender;

        stake = _abort(party);
        // transfer stake to party
        if (stake > 0)
            require(IERC20(BurnNMR.getToken()).transfer(party, stake));
    }

    function _abort(address party) internal returns (uint256 stake) {
        require(params.status == Status.Created || params.status == Status.Sealed, "invalid agreement state");
        require(partyList.exists(party), "only party");

        params.status = Status.Ended;
        emit Ended(party, false);

        if (parties[party].signed)
            stake = _recoverStake(party);
        else
            stake = 0;
    }

    // Call with signed message
    function end(bytes memory signature) public {
        address party = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(
                getEndSig()
            ),
            signature
        );
        require(party != address(0), 'check signature validity');

        _end(party);
    }

    // Call from trusted operator
    function end(address party) public {
        require(msg.sender == params.operator, "only operator");
        require(params.trustedOperator, "only trusted operator");

        _end(party);
    }

    // Call from party address
    function end() public {
        address party = msg.sender;

        _end(party);
    }

    function _end(address party) internal {
        require(params.status == Status.Signed, "invalid agreement state");
        require(partyList.exists(party), "only party");

        require(now > params.griefDeadline, "only after grief deadline");
        params.status = Status.Ended;
        emit Ended(party, true);
    }

    // Call with signed message
    function recoverStake(bytes memory signature) public returns (uint256 stake) {
        address party = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(
                getRecoverSig()
            ),
            signature
        );
        require(party != address(0), 'check signature validity');

        stake = _recoverStake(party);
        // transfer stake to party
        require(IERC20(BurnNMR.getToken()).transfer(party, stake), "token transfer failed");
    }

    // Call from trusted operator
    function recoverStake(address party) public returns (uint256 stake) {
        require(msg.sender == params.operator, "only operator");
        require(params.trustedOperator, "only trusted operator");

        stake = _recoverStake(party);
        // transfer stake to operator
        require(IERC20(BurnNMR.getToken()).transfer(params.operator, stake), "token transfer failed");
    }

    // Call from party address
    function recoverStake() public returns (uint256 stake) {
        address party = msg.sender;

        stake = _recoverStake(party);
        // transfer stake to party
        require(IERC20(BurnNMR.getToken()).transfer(party, stake), "token transfer failed");
    }

    function _recoverStake(address party) internal returns (uint256 stake) {
        if (params.status == Status.Signed) {
            _end(party);
        }

        require(params.status == Status.Ended, "invalid agreement state");
        require(partyList.exists(party), "only party");

        require(parties[party].stake > 0 && parties[party].signed, "no stake to recover");

        stake = parties[party].stake;
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

    function getSignSig() public view returns (bytes32 functionSig) {
        functionSig = keccak256(abi.encodePacked(
            abi.encodeWithSignature('sign()'), // 0x2ca15122
            address(this))
        );
    }

    function getGriefSig(address counterparty, uint256 punishment, bytes memory message) public view returns (bytes32 functionSig) {
        functionSig = keccak256(abi.encodePacked(
            abi.encodeWithSignature('grief(address, uint256, bytes)'), // 0xbfc30450
            address(this),
            counterparty,
            punishment,
            message
        ));
    }

    function getAbortSig() public view returns (bytes32 functionSig) {
        functionSig = keccak256(abi.encodePacked(
            abi.encodeWithSignature('abort()'), // 0x35a063b4
            address(this))
        );
    }

    function getEndSig() public view returns (bytes32 functionSig) {
        functionSig = keccak256(abi.encodePacked(
            abi.encodeWithSignature('end()'), // 0xefbe1c1c
            address(this))
        );
    }

    function getRecoverSig() public view returns (bytes32 functionSig) {
        functionSig = keccak256(abi.encodePacked(
            abi.encodeWithSignature('recoverStake()'), // 0x2a9a347a
            address(this))
        );
    }

    // Storage Getters

    function getStake(address party) public view returns (uint256 amount) {
        amount = parties[party].stake;
    }

}
