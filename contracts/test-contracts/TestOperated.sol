pragma solidity ^0.5.0;

import "../modules/Operated.sol";

contract TestOperated is Operated {

    function setOperator(address operator) public {
        Operated._setOperator(operator);
    }

    function activateOperator() public {
    // backdoor function to activate Operator for testing
        Operated._activateOperator();
    }

    function deactivateOperator() public {
    // backdoor function to deactivate Operator for testing
        Operated._deactivateOperator();
    }

    function renounceOperator() public {
        Operated._renounceOperator();
    }

    function transferOperator(address newOperator) public {
        Operated._transferOperator(newOperator);
    }

    function testIsOperator(address caller) public view returns (bool validity) {
        return Operated.isOperator(caller);
    }

    function testIsActiveOperator(address caller) public view returns (bool validity) {
        return Operated.isActiveOperator(caller);
    }
}
