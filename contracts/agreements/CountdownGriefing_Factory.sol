pragma solidity 0.5.16;

import "../modules/Factory.sol";
import "./CountdownGriefing.sol";


/// @title CountdownGriefing_Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.3.0
/// @notice This factory is used to deploy instances of the template contract.
///         New instances can be created with the following functions:
///             `function create(bytes calldata initData) external returns (address instance);`
///             `function createSalty(bytes calldata initData, bytes32 salt) external returns (address instance);`
///         The `initData` parameter is ABI encoded calldata to use on the initialize function of the instance after creation.
///         The optional `salt` parameter can be used to deterministically generate the instance address instead of using a nonce.
///         See documentation of the template for additional details on initialization parameters.
///         The template contract address can be optained with the following function:
///             `function getTemplate() external view returns (address template);`
contract CountdownGriefing_Factory is Factory {

    constructor(address instanceRegistry, address templateContract) public {
        CountdownGriefing template;

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Agreement')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
