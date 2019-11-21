pragma solidity ^0.5.13;

import "../modules/Factory.sol";
import "./CountdownGriefingEscrow.sol";


/// @title CountdownGriefingEscrow_Factory
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.2.0
contract CountdownGriefingEscrow_Factory is Factory {

    constructor(address instanceRegistry, address templateContract) public {
        CountdownGriefingEscrow template;

        // set instance type
        bytes4 instanceType = bytes4(keccak256(bytes('Escrow')));
        // set initSelector
        bytes4 initSelector = template.initialize.selector;
        // initialize factory params
        Factory._initialize(instanceRegistry, templateContract, instanceType, initSelector);
    }

}
