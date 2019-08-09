pragma solidity ^0.5.0;

import "../modules/Metadata.sol";

contract TestMetadata is Metadata {
    function setStaticMetadata(bytes memory staticMetadata) public {
       Metadata._setStaticMetadata(staticMetadata);
    }

    function setVariableMetadata(bytes memory variableMetadata) public {
      Metadata._setVariableMetadata(variableMetadata);
    }
}
