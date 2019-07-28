pragma solidity ^0.5.0;

import "../agreements/OneWayGriefing.sol";

contract TestOneWayGriefing {
  constructor(
      address griefingContract,
      address token,
      address operator,
      address staker,
      address counterparty,
      uint256 ratio,
      Griefing.RatioType ratioType,
      uint256 countdownLength,
      bytes memory staticMetadata) public {
      
      initializeOneWayGriefing(
          griefingContract,
          token,
          operator,
          staker,
          counterparty,
          ratio,
          ratioType,
          countdownLength,
          staticMetadata
      );
  }

  function initializeOneWayGriefing(
      address griefingContract,
      address token,
      address operator,
      address staker,
      address counterparty,
      uint256 ratio,
      Griefing.RatioType ratioType,
      uint256 countdownLength,
      bytes memory staticMetadata
  ) public {
      OneWayGriefing template;

      bytes memory initData = abi.encodeWithSelector(
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

      // delegatecall returns the revert bool and reason
      // surface the revert reason to tests
      (bool revertStatus, bytes memory revertReason) = griefingContract.delegatecall(initData);
      require(revertStatus, string(revertReason));
  }
}
