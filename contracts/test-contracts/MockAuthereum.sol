pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

interface IAuthereumAccount {
    // This is required for funds sent to this contract
    function () external payable;

    /// @dev Get the chain ID constant
    /// @return The chain id
    function getChainId() external pure returns (uint256);

    /// @dev Add an auth key to the list of auth keys
    /// @param _authKey Address of the auth key to add
    function addAuthKey(address _authKey) external;

    /// @dev Remove an auth key from the list of auth keys
    /// @param _authKey Address of the auth key to remove
    function removeAuthKey(address _authKey) external;

    /// @dev Check if a message and signature pair is valid
    /// @notice The _signatures parameter can either be one auth key signature or it can
    /// @notice be a login key signature and an auth key signature (signed login key)
    /// @param _msg Message that was signed
    /// @param _signatures Signature(s) of the data. Either a single signature (login) or two (login and auth)
    /// @return VALID_SIG or INVALID_SIG hex data
    function isValidSignature(bytes calldata _msg, bytes calldata _signatures) external view returns (bytes4);

    /// @dev Check if a message and auth key signature pair is valid
    /// @param _msg Message that was signed
    /// @param _signature Signature of the data signed by the authkey
    /// @return VALID_SIG or INVALID_SIG hex data
    function isValidAuthKeySignature(bytes calldata _msg, bytes calldata _signature) external view returns (bytes4);

    /// @dev Check if a message and login key signature pair is valid, as well as a signed login key by an auth key
    /// @param _msg Message that was signed
    /// @param _signatures Signatures of the data. Signed msg data by the login key and signed login key by auth key
    /// @return VALID_SIG or INVALID_SIG hex data
    function isValidLoginKeySignature(bytes calldata _msg, bytes calldata _signatures) external view returns (bytes4);

    /// @dev Execute multiple meta transactions
    /// @notice This can only be called by self as a part of the atomic meta transaction
    /// @param _transactions Arrays of transaction data ([destination, value, gasLimit, data][...]...)
    /// @return the transactionMessageHash and responses of the calls
    function executeMultipleMetaTransactions(bytes[] calldata _transactions) external returns (bytes32, bytes[] memory);

    /// @dev Execute multiple authKey meta transactions
    /// @param _transactions Arrays of transaction data ([destination, value, gasLimit, data][...]...)
    /// @param _gasPrice Gas price set by the user
    /// @param _gasOverhead Gas overhead of the transaction calculated offchain
    /// @param _feeTokenAddress Address of the token used to pay a fee
    /// @param _feeTokenRate Rate of the token (in tokenGasPrice/ethGasPrice) used to pay a fee
    /// @param _transactionMessageHashSignature Signed transaction data
    function executeMultipleAuthKeyMetaTransactions(
        bytes[] calldata _transactions,
        uint256 _gasPrice,
        uint256 _gasOverhead,
        address _feeTokenAddress,
        uint256 _feeTokenRate,
        bytes calldata _transactionMessageHashSignature
    ) external returns (bytes[] memory);

    /// @dev Execute an loginKey meta transaction
    /// @param _transactions Arrays of transaction data ([destination, value, gasLimit, data][...]...)
    /// @param _gasPrice Gas price set by the user
    /// @param _gasOverhead Gas overhead of the transaction calculated offchain
    /// @param _loginKeyRestrictionsData Contains restrictions to the loginKey's functionality
    /// @param _feeTokenAddress Address of the token used to pay a fee
    /// @param _feeTokenRate Rate of the token (in tokenGasPrice/ethGasPrice) used to pay a fee
    /// @param _transactionMessageHashSignature Signed transaction data
    /// @param _loginKeyAttestationSignature Signed loginKey
    /// @return Response of the call
    function executeMultipleLoginKeyMetaTransactions(
        bytes[] calldata _transactions,
        uint256 _gasPrice,
        uint256 _gasOverhead,
        bytes calldata _loginKeyRestrictionsData,
        address _feeTokenAddress,
        uint256 _feeTokenRate,
        bytes calldata _transactionMessageHashSignature,
        bytes calldata _loginKeyAttestationSignature
    ) external returns (bytes[] memory);

    /**
     *  ERC721
     */

    /**
     * @notice Handle the receipt of an NFT
     * @dev The ERC721 smart contract calls this function on the recipient
     * after a {IERC721-safeTransferFrom}. This function MUST return the function selector,
     * otherwise the caller will revert the transaction. The selector to be
     * returned can be obtained as `this.onERC721Received.selector`. This
     * function MAY throw to revert and reject the transfer.
     * Note: the ERC721 contract address is always the message sender.
     * param operator The address which called `safeTransferFrom` function
     * param from The address which previously owned the token
     * param tokenId The NFT identifier which is being transferred
     * param data Additional data with no specified format
     * @return bytes4 `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
     */
    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4);

    /**
     *  ERC1155
     */

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external returns(bytes4);

    /**
     * @notice Handle the receipt of multiple ERC1155 token types.
     * @dev An ERC1155-compliant smart contract MUST call this function on the token recipient contract, at the end of a `safeBatchTransferFrom` after the balances have been updated.
     * This function MUST return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81) if it accepts the transfer(s).
     * This function MUST revert if it rejects the transfer(s).
     * Return of any other value than the prescribed keccak256 generated value MUST result in the transaction being reverted by the caller.
     * param _operator  The address which initiated the batch transfer (i.e. msg.sender)
     * param _from      The address which previously owned the token
     * param _ids       An array containing ids of each token being transferred (order and length must match _values array)
     * param _values    An array containing amounts of each token being transferred (order and length must match _ids array)
     * param _data      Additional data with no specified format
     * @return           `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     */
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external returns(bytes4);
}