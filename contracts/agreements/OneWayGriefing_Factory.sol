pragma solidity ^0.5.0;

import "../modules/Factory.sol";
import "./OneWayGriefing.sol";


contract OneWayGriefing_Factory is Factory {

    constructor(address instanceRegistry) public {
        // deploy template contract
        address templateContract = address(new OneWayGriefing());
        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initdataABI
        string memory initdataABI = '(address,address,address,address,uint256,Griefing.RatioType,uint256,bytes)';
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initdataABI);
    }

    event ExplicitInitData(address indexed staker, address indexed counterparty, address indexed operator, uint256 ratio, Griefing.RatioType ratioType, uint256 countdownLength, bytes staticMetadata);

    function create(bytes memory callData) public returns (address instance) {
        // deploy instance
        instance = Factory._create(callData);
    }

    function createEncoded(bytes memory initdata) public returns (address instance) {
        // decode initdata
        (
            address token,
            address operator,
            address staker,
            address counterparty,
            uint256 ratio,
            Griefing.RatioType ratioType,
            uint256 countdownLength,
            bytes memory staticMetadata
        ) = abi.decode(initdata, (address,address,address,address,uint256,Griefing.RatioType,uint256,bytes));

        // call explicit create
        instance = createExplicit(token, operator, staker, counterparty, ratio, ratioType, countdownLength, staticMetadata);
    }

    function createExplicit(
        address token,
        address operator,
        address staker,
        address counterparty,
        uint256 ratio,
        Griefing.RatioType ratioType,
        uint256 countdownLength,
        bytes memory staticMetadata
    ) public returns (address instance) {
        // declare template in memory
        OneWayGriefing template;

        // construct the data payload used when initializing the new contract.
        bytes memory callData = abi.encodeWithSelector(
            template.initialize.selector, // selector
            token,           // token
            operator,        // operator
            staker,          // staker
            counterparty,    // counterparty
            ratio,           // ratio
            ratioType,       // ratioType
            countdownLength, // countdownLength
            staticMetadata   // staticMetadata
        );

        // deploy instance
        instance = Factory._create(callData);

        // emit event
        emit ExplicitInitData(staker, counterparty, operator, ratio, ratioType, countdownLength, staticMetadata);
    }

}
