pragma solidity ^0.5.0;

import "./Registry.sol";


contract AgreementsRegistry is Registry {

    event AgreementCreated(address agreement, address creator, uint256 factoryID);

    struct Agreement {
        address agreement;
        uint16 factoryID;
        uint80 extraData;
    }

    // TODO: private with explicit getters
    Agreement[] public agreements;

    constructor() public Registry('Agreement') {

    }

    function append(address agreement, address creator, uint64 extraData) public {
        (
            Registry.FactoryState state,
            uint16 factoryID,
            // bytes memory extraData
        ) = getFactory(msg.sender);

        // ensure that the caller is a registered factory
        require(
            state == FactoryState.Registered,
            "Factory in wrong state."
        );

        uint256 agreementIndex = agreements.length;
        agreements.push(
            Agreement({
                agreement: agreement,
                factoryID: factoryID,
                extraData: extraData
            })
        );

        emit AgreementCreated(agreement, creator, agreementIndex);
    }
}
