pragma solidity ^0.5.0;

import "./helpers/openzeppelin-eth/math/SafeMath.sol";
import "./helpers/openzeppelin-eth/token/ERC20/ERC20Burnable.sol";


contract AgreementRegistry {

    using SafeMath for uint256;

    Agreement[] public agreements;
    Template[] public templates;

    address public nmr;

    struct Template {
        address factory;
        bytes metadata;
    }

    struct Agreement {
        bytes initPayload;
        bytes[] signatures;
        address instance;
        uint256 templateID;
    }

    event TemplateCreated(address factory, bytes metadata);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // TEMPLATES //

    function createTemplate(address factory, bytes memory metadata) public {
        templates.push(Template(factory, metadata));
        emit TemplateCreated(factory, metadata);
    }

    // PROPOSALS //

    function submitProposal() public {
        
    }

    function acceptProposal() public {

    }

    function _createAgreement() internal {

    }

}
