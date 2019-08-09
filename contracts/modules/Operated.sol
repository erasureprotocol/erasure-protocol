pragma solidity ^0.5.0;


contract Operated {

    OperatorData private _operatorData;

    struct OperatorData {
        address operator;
        bool status;
    }

    event StatusUpdated(address operator, bool status);

    // state functions

    function _setOperator(address operator) internal {
        require(_operatorData.operator != operator, "same operator set");
        _operatorData.operator = operator;
        emit StatusUpdated(operator, _operatorData.status);
    }

    function _activate() internal {
        require(_operatorData.status == false, "already active");
        _operatorData.status = true;
        emit StatusUpdated(_operatorData.operator, true);
    }

    function _deactivate() internal {
        require(_operatorData.status == true, "already deactivated");
        _operatorData.status = false;
        emit StatusUpdated(_operatorData.operator, false);
    }

    // view functions

    function getOperator() public view returns (address operator) {
        operator = _operatorData.operator;
    }

    function isOperator(address caller) public view returns (bool validity) {
        validity = (caller == getOperator());
    }

    function isActive() public view returns (bool status) {
        status = _operatorData.status;
    }

    function isActiveOperator(address caller) public view returns (bool validity) {
        validity = (isOperator(caller) && isActive());
    }

}
