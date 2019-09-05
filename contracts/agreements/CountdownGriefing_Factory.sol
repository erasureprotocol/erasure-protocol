pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./CountdownGriefing.sol";


contract CountdownGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new CountdownGriefing());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initdataABI
        string memory initdataABI = '(address,address,address,address,uint256,uint8,uint256,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(address indexed staker, address indexed counterparty, address indexed operator, uint256 ratio, Griefing.RatioType ratioType, uint256 countdownLength, bytes staticMetadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createSalty(bytes memory callData, bytes32 salt) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData, salt);
    }

}
