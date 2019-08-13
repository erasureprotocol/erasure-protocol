pragma solidity ^0.5.0;

import "../modules/ProofHash.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";


contract Post is ProofHash, Operated, Metadata, Template {

    event Created(address operator, bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function initialize(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public {
        // only allow function to be delegatecalled from within a constructor.
        uint32 codeSize;
        assembly { codeSize := extcodesize(address) }
        require(codeSize == 0, "must be called within contract constructor");

        // set storage variables
        ProofHash._setProofHash(proofHash);

        // set operator
        Operated._setOperator(operator);
        Operated._activateOperator();

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // set variable metadata
        Metadata._setVariableMetadata(variableMetadata);

        // emit event
        emit Created(operator, proofHash, staticMetadata, variableMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // only active operator
        require(Operated.isActiveOperator(msg.sender), "only active operator");

        // set metadata in storage
        Metadata._setVariableMetadata(variableMetadata);
    }

}
