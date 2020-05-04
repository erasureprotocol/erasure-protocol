pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./iNMR.sol";

/// @title Utils
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @dev Version: 1.4.0
/// @notice This contract implements frequent code snippets.
contract ERC20Utils {
    function _forwardApproval(address token, address from, address to, uint256 value) internal {
        // pull tokens
        require(IERC20(token).transferFrom(from, address(this), value), "Utils/_forwardApproval: token.transferFrom failed");
        // make approval
        require(IERC20(token).approve(to, value), "Utils/_forwardApproval: token.approve failed");
    }

    function _forwardNMRApproval(address token, address from, address to, uint256 value) internal {
        // pull tokens
        require(IERC20(token).transferFrom(from, address(this), value), "Utils/_forwardApproval: token.transferFrom failed");
        // make approval
        require(IERC20(token).approve(to, 0), "Utils/_forwardApproval: token.approve failed");
        require(IERC20(token).approve(to, value), "Utils/_forwardApproval: token.approve failed");
    }

    function _NMRApprove() internal {

    }
}