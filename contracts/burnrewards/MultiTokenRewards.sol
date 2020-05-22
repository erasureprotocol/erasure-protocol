pragma solidity 0.5.16;

import "./BurnRewards.sol";
import "../modules/tokens/NMRUtils.sol";
import "../helpers/UniswapExchangeInterface.sol";
import "../helpers/UniswapFactoryInterface.sol";

/// @title MultiTokenRewards
/// @author Stephane Gosselin (@thegostep) for Numerai Inc
/// @dev Security contact: security@numer.ai
/// @notice This contract swaps any ERC20 tokens with Uniswap to claim and distribute burn rewards.
/// TODO: check appropriate behaviour if no uniswap pool or pool with no liquidity
contract MultiTokenRewards is NMRUtils {

    address private _burnRewards;
    address private constant _factory = _mainnet;

    address private constant _mainnet = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;
    address private constant _ropsten = 0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351;
    address private constant _rinkeby = 0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36;
    address private constant _kovan = 0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30;
    address private constant _gorli = 0x6Ce570d02D73d4c384b46135E87f8C592A8c86dA;
    
    event SwapAndClaimed(address token, address from, uint256 inputAmount, uint256 nmrBurned, uint256 nmrReward);

    constructor(address burnRewards) public {
        _burnRewards = burnRewards;
    }

    /// @notice Claims burn rewards with any ERC20 token.
    /// @param value uint256 The amount of tokens (ERC20) being sent.
    /// @param token address The address of the token (ERC20) being sent.
    /// @param minNMRBurned uint256 The minimum amount of NMR (18 decimals) to be burned.
    /// @param rewardRecipient address The account to receive the burn reward.
    /// @return reward uint256 The amount of NMR (18 decimals) rewarded.
    function swapAndClaim(
        uint256 value,
        address token,
        uint256 minNMRBurned,
        address rewardRecipient
    ) public returns (uint256 reward) {
        // forward token approval
        ERC20Utils._forwardApproval(token, msg.sender, getUniswapAddress(token), value);

        // get expected swap amount
        (uint256 expectedNMR, uint256 expectedETH) = getExpectedSwapAmount(token, value);
        require(expectedNMR >= minNMRBurned, "MultiTokenRewards/swapAndClaim: less NMR than expected");

        // swap tokens
        uint256 amountNMR = UniswapExchangeInterface(getUniswapAddress(token)).tokenToTokenSwapInput(
            value,
            expectedNMR,
            expectedETH,
            now,
            getNMRAddress()
        );

        // claim BurnRewards
        NMRUtils._changeApproval(_burnRewards, amountNMR);
        reward = BurnRewards(_burnRewards).burnAndClaim(amountNMR, rewardRecipient);

        // emit event
        emit SwapAndClaimed(token, msg.sender, value, amountNMR, reward);

        // return reward amount
        return reward;
    }

    /// @notice Get the amount of NMR and ETH required to sell a given amount of tokens.
    /// @param token address The address of the token (ERC20) being sent.
    /// @param amount uint256 The amount of tokens to sell.
    /// @param amountNMR uint256 The amount of NMR (18 decimals) required.
    /// @param amountETH uint256 The amount of ETH (18 decimals) required.
    function getExpectedSwapAmount(address token, uint256 amount) internal view returns (uint256 amountNMR, uint256 amountETH) {
        amountETH = UniswapExchangeInterface(getUniswapAddress(token)).getTokenToEthInputPrice(amount);
        amountNMR = UniswapExchangeInterface(getNMRAddress()).getEthToTokenInputPrice(amountETH);
        return (amountNMR, amountETH);
    }

    /// @notice Get the Uniswap factory address.
    /// @return uniswapFactory address The Uniswap factory address.
    function getUniswapFactoryAddress() public pure returns (address uniswapFactory) {
        return _factory;
    }

    /// @notice Get the Uniswap exchange address for given token.
    /// @param token address The address of the token (ERC20).
    /// @return uniswap address The Uniswap exchange address.
    function getUniswapAddress(address token) public view returns (address uniswap) {
        return UniswapFactoryInterface(_factory).getExchange(token);
    }

    /// @notice Get the BurnRewards address.
    /// @return burnRewards address The BurnRewards address.
    function getBurnRewardsAddress() public view returns (address burnRewards) {
        return _burnRewards;
    }

    /// @notice Get the NMR token address.
    /// @return token address The NMR token address.
    function getNMRAddress() public pure returns (address nmrAddress) {
        return NMRUtils.getTokenAddress();
    }

}
