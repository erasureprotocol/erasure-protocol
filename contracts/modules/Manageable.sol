pragma solidity >=0.5.0 <0.6.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an owner and a manager that can be granted exclusive access to
 * specific functions.
 */
contract Manageable is Ownable {
    address private _manager;

    event ManagementTransferred(address indexed previousManager, address indexed newManager);

    /**
     * @dev Initializes the contract setting the deployer as the initial manager.
     */
    constructor () internal Ownable() {
        _manager = _msgSender();
        emit ManagementTransferred(address(0), _manager);
    }

    /**
     * @return the address of the manager.
     */
    function manager() public view returns (address) {
        return _manager;
    }

    /**
     * @dev Throws if called by any account other than the owner or manager.
     */
    modifier onlyManagerOrOwner() {
        require(isManagerOrOwner(), "Manageable: caller is not the manager or owner");
        _;
    }

    /**
     * @return true if `msg.sender` is the owner or manager of the contract.
     */
    function isManagerOrOwner() public view returns (bool) {
        return (_msgSender() == _manager || isOwner());
    }

    /**
     * @dev Leaves the contract without manager. Owner will need to set a new manager.
     * Can only be called by the current owner or manager.
     */
    function renounceManagement() public onlyManagerOrOwner {
        emit ManagementTransferred(_manager, address(0));
        _manager = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newManager.
     * Can only be called by the current owner.
     * @param newManager The address to transfer management to.
     */
    function transferManagement(address newManager) public onlyOwner {
        require(newManager != address(0), "Manageable: new manager is the zero address");
        emit ManagementTransferred(_manager, newManager);
        _manager = newManager;
    }
}