pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./SimpleGriefing.sol";


contract SimpleGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new SimpleGriefing());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initdataABI
        string memory initdataABI = '(address,address,address,address,bytes,bytes,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(
        address indexed stakerA,
        address indexed stakerB,
        address indexed operator,
        bytes stakeDataA,
        bytes stakeDataB,
        bytes staticMetadata
    );

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address token,
            address operator,
            address stakerA,
            address stakerB,
            bytes memory stakeDataA,
            bytes memory stakeDataB,
            bytes memory staticMetadata
        ) = abi.decode(initdata, (address,address,address,address,bytes,bytes,bytes));

        // call explicit create
        instance = createExplicit(token, operator, stakerA, stakerB, stakeDataA, stakeDataB, staticMetadata);
    }

    function createExplicit(
        address token,
        address operator,
        address stakerA,
        address stakerB,
        bytes memory stakeDataA,
        bytes memory stakeDataB,
        bytes memory staticMetadata
    ) public returns (address instance) {
        // declare template in memory
        SimpleGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,          // token
            operator,       // operator
            stakerA,        // first staker
            stakerB,        // second staker
            stakeDataA,     // stake data for stakerA
            stakeDataB,     // stake data for stakerB
            staticMetadata  // staticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(stakerA, stakerB, operator, stakeDataA, stakeDataB, staticMetadata);
    }

}
