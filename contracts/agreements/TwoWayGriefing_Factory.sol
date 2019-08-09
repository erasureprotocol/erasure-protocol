pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./TwoWayGriefing.sol";


contract TwoWayGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new TwoWayGriefing());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initdataABI
        string memory initdataABI = '(address,address,bytes,bytes,uint256,bytes)';
        // set calldataABI
        string memory calldataABI = '(bytes4,address,address,bytes,bytes,uint256,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI, calldataABI);
    }

    event ExplicitInitData(address indexed operator, bytes stakeDataA, bytes stakeDataB, uint256 countdownLength, bytes staticMetadata);

    function create(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address token,
            address operator,
            bytes memory stakeDataA,
            bytes memory stakeDataB,
            uint256 countdownLength,
            bytes memory staticMetadata
        ) = abi.decode(initdata, (address,address,bytes,bytes,uint256,bytes));

        // call explicit create
        instance = createExplicit(token, operator, stakeDataA, stakeDataB, countdownLength, staticMetadata);
    }

    function createExplicit(
        address token,
        address operator,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public returns (address instance) {
        // declare template in memory
        TwoWayGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,
            operator,
            stakeDataA,
            stakeDataB,
            countdownLength,
            staticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(operator, stakeDataA, stakeDataB, countdownLength, staticMetadata);
    }

}
