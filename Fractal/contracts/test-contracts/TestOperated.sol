pragma solidity ^0.5.0;

import "../modules/Operated.sol";

contract TestOperated is Operated {

    function setOperator(address operator) public {
        Operated._setOperator(operator);
    }

    function activate() public {
        Operated._activate();
    }

    function deactivate() public {
        Operated._deactivate();
    }
}
