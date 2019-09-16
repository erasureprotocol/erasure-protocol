pragma solidity ^0.5.0;

import "../modules/ProofHash.sol";
import "../modules/Metadata.sol";
import "../modules/Operated.sol";
import "../modules/Template.sol";


contract Post is ProofHash, Operated, Metadata, Template {

    event Initialized(address operator, bytes proofHash, bytes staticMetadata, bytes variableMetadata);

    function initialize(
        address operator,
        bytes memory proofHash,
        bytes memory staticMetadata,
        bytes memory variableMetadata
    ) public initializeTemplate() {
        // set storage variables
        ProofHash._setProofHash(proofHash);

        // set operator
        if (operator != address(0)) {
            Operated._setOperator(operator);
            Operated._activateOperator();
        }

        // set static metadata
        Metadata._setStaticMetadata(staticMetadata);

        // set variable metadata
        Metadata._setVariableMetadata(variableMetadata);

        // log initialization params
        emit Initialized(operator, proofHash, staticMetadata, variableMetadata);
    }

    // state functions

    function setVariableMetadata(bytes memory variableMetadata) public {
        // only active operator or creator
        require(Template.isCreator(msg.sender) || Operated.isActiveOperator(msg.sender), "only active operator or creator");

        // set metadata in storage
        Metadata._setVariableMetadata(variableMetadata);
    }

}
