pragma solidity ^0.5.13;

import "../modules/EventMetadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";
import "../modules/Deposit.sol";
import "../modules/ProofHashes.sol";


/// @title Feed
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract StakedFeed is Deposit, ProofHashes, Operated, EventMetadata, Template {

    event Initialized(address operator, bytes32 proofHash, bytes metadata);

    /// @notice Constructor
    /// @dev Access Control: only factory
    ///      State Machine: before all
    /// @param operator Address of the operator that overrides access control
    /// @param proofHash Proofhash (bytes32) sha256 hash of timestampled data
    /// @param metadata Data (any format) to emit as event on initialization
    function initialize(
        address operator,
        bytes32 proofHash,
        bytes memory metadata
    ) public initializeTemplate() {
        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
        }

        // submit proofHash
        if (proofHash != bytes32(0)) {
            ProofHashes._submitHash(proofHash);
        }

        // set metadata
        if (metadata.length != 0) {
            EventMetadata._setMetadata(metadata);
        }

        // log initialization params
        emit Initialized(operator, proofHash, metadata);
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

    /// @notice Deposit ERC20 token.
    ///         - This deposit can be withdrawn at anytime by the owner of the feed.
    ///         - This requires the caller to do ERC20 approval for this contract for `amountToAdd`.
    /// @dev Access Control: creator OR operator
    ///      State Machine: anytime
    /// @param token address of the ERC20 token.
    /// @param amountToAdd uint256 amount of ERC20 tokens to add. Note the number of decimals depends on the ERC20 implementation.
    function depositERC20(address token, uint256 amountToAdd) public returns (uint256 newDeposit) {
        // only operator or creator
        require(Template.isCreator(msg.sender) || Operated.isOperator(msg.sender), "only operator or creator");

        //
    }

    function withdrawERC20(address token, uint256 amountToRemove) public {

    }

    function stakeETH() public payable {

    }

    function withdrawETH() public payable {

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

}
