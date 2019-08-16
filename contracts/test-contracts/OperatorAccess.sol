pragma solidity ^0.5.0;

import "../modules/Operated.sol";

contract OperatorAccess is Operated {

    // backdoor function to deactivate Operator for testing
    function deactivateOperator() public {
        Operated._deactivateOperator();
    }

    // backdoor function to activate Operator for testing
    function activateOperator() public {
        Operated._activateOperator();
    }

}
