pragma solidity ^0.5.0;

import "../modules/MultiHashWrapper.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";


contract Post is MultiHashWrapper, Operated, Metadata {

    MultiHash private _proofHash;

    event Created(address operator, bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function initialize(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        assembly { if extcodesize(address) { revert(0, 0) } }

        // set storage variables
        _proofHash = MultiHashWrapper._splitMultiHash(proofHash);

        // set operator
        Operated._setOperator(operator);
        Operated._activate();

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // set variable metadata
        Metadata._setVariableMetadata(variableMetadata);

        // emit event
        emit Created(operator, proofHash, staticMetadata, variableMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // only operator
        require(Operated.isOperator(msg.sender), "only operator");

        // set metadata in storage
        Metadata._setVariableMetadata(variableMetadata);
    }

    // view functions

    function getProofHash() public view returns (bytes memory proofHash) {
        proofHash = MultiHashWrapper._combineMultiHash(_proofHash);
    }

}
