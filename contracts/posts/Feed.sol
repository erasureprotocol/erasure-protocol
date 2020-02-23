pragma solidity 0.5.16;

import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";
import "../modules/Staking.sol";
import "../modules/ProofHashes.sol";


/// @title Feed
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice A Feed allows for the creator to build a track record of timestamped submissions and deposit a stake to signal legitimacy.
contract Feed is Staking, ProofHashes, Operated, EventMetadata, Template {

    event Initialized(address operator, bytes metadata);

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator Address of the operator that overrides access control
    /// @param metadata Data (any format) to emit as event on initialization
    function initialize(
        address operator,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, metadata);
    }

    // state functions

    /// @notice Submit proofhash to add to feed
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param proofHash Proofhash (bytes32) sha256 hash of timestampled data
    function submitHash(bytes32 proofHash) public {
        // only operator or creator
        require(Template.isCreator(msg.sender) || Operated.isOperator(msg.sender), "only operator or creator");

        // submit proofHash
        ProofHashes._submitHash(proofHash);
    }

    /// @notice Deposit one of the supported ERC20 token.
    ///         - This deposit can be withdrawn at any time by the owner of the feed.
    ///         - This requires the caller to do ERC20 approval for this contract for `amountToAdd`.
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param tokenID TokenManager.Tokens id of the ERC20 token.
    /// @param amountToAdd uint256 amount of ERC20 tokens (18 decimals) to add.
    function depositStake(TokenManager.Tokens tokenID, uint256 amountToAdd) public returns (uint256 newStake) {
        // only operator or creator
        require(Template.isCreator(msg.sender) || Operated.isOperator(msg.sender), "only operator or creator");

        // transfer and add tokens to stake
        return Staking._addStake(tokenID, Template.getCreator(), msg.sender, amountToAdd);
    }

    /// @notice Withdraw one of the supported ERC20 token.
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param tokenID TokenManager.Tokens id of the ERC20 token.
    /// @param amountToRemove uint256 amount of ERC20 tokens (18 decimals) to add.
    function withdrawStake(TokenManager.Tokens tokenID, uint256 amountToRemove) public returns (uint256 newStake) {
        // only operator or creator
        require(Template.isCreator(msg.sender) || Operated.isOperator(msg.sender), "only operator or creator");

        // transfer and remove tokens from stake
        return Staking._takeStake(tokenID, Template.getCreator(), Template.getCreator(), amountToRemove);
    }

    /// @notice Emit metadata event
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param metadata Data (any format) to emit as event
    function setMetadata(bytes memory metadata) public {
        // only operator or creator
        require(Template.isCreator(msg.sender) || Operated.isOperator(msg.sender), "only operator or creator");

        // set metadata
        EventMetadata._setMetadata(metadata);
    }

    /// @notice Called by the operator to transfer control to new operator
    /// @dev Access Control: operator
    ///      State Machine: anytime
    /// @param operator Address of the new operator
    function transferOperator(address operator) public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // transfer operator
        Operated._transferOperator(operator);
    }

    /// @notice Called by the operator to renounce control
    /// @dev Access Control: operator
    ///      State Machine: anytime
    function renounceOperator() public {
        // restrict access
        require(Operated.isOperator(msg.sender), "only operator");

        // renounce operator
        Operated._renounceOperator();
    }

    /// @notice Get the current stake for a given ERC20 token.
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param tokenID TokenManager.Tokens id of the ERC20 token.
    function getStake(TokenManager.Tokens tokenID) public view returns (uint256 stake) {
        return Deposit.getDeposit(tokenID, Template.getCreator());
    }

}
