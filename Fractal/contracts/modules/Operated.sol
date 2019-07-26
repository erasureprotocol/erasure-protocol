pragma solidity ^0.5.0;


contract Operated {

    address private _operator;

    modifier onlyOperator() {
        require(msg.sender == getOperator(), "only operator");
        _;
    }

    constructor() internal {
        _setOperator(msg.sender);
    }

    function _setOperator(address operator) internal {
        _operator = operator;
    }

    function getOperator() public view returns (address operator) {
        operator = _operator;
    }

}
