pragma solidity ^0.5.0;

import "./Registry.sol";


contract AgreementsRegistry is Registry {
    event AgreementCreated(address agreement, address creator, uint256 index);

    struct Agreement {
        address agreement;
        uint16 factoryID;
        uint80 extraData;
    }

    // TODO: private with explicit getters
    Agreement[] public agreements;


    constructor() public {
        require(
            RegistryType(getRegistryType()) == RegistryType.Agreement,
            "Incorrect registry type is set."
        );
    }

    function append(address agreement, address creator, uint64 extraData) public {
        (
            bool exists,
            uint16 index,
            , // address implementation
            bool retired,
            // bytes memory extraData
        ) = getFactory(msg.sender);
        require(
            exists,
            "Agreement must originate from an approved factory."
        );
        require(
            !retired,
            "Agreement cannot originate from a retired factory."
        );

        uint256 agreementIndex = agreements.length;
        agreements.push(
            Agreement({
                agreement: agreement,
                factoryID: index,
                extraData: extraData
            })
        );

        emit AgreementCreated(agreement, creator, agreementIndex);
    }
}
