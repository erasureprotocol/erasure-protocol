pragma solidity 0.5.16;

import "../modules/Operated.sol";

contract TestOperated is Operated {

    function setOperator(address operator) public {
        Operated._setOperator(operator);
    }

    function transferOperator(address newOperator) public {
        Operated._transferOperator(newOperator);
    }

    function renounceOperator() public {
        Operated._renounceOperator();
    }

    function testIsOperator(address caller) public view returns (bool validity) {
        return Operated.isOperator(caller);
    }
}
