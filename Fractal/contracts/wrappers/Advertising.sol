pragma solidity ^0.5.0;

import "../helpers/openzeppelin-solidity/math/SafeMath.sol";
import "../helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";
import "../helpers/HitchensUnorderedKeySet.sol";
import "../Erasure_Posts.sol";


contract Advertising {

    using SafeMath for uint256;

    using HitchensUnorderedKeySetLib for HitchensUnorderedKeySetLib.Set;
    HitchensUnorderedKeySetLib.Set adSet;

    address public nmr;
    address public erasurePosts;

    mapping (uint256 => Ad) ads;

    struct Ad {
        uint256 stake;
        uint256 deadline;
        bytes metadata;
    }

    event AdCreated(uint256 postID, address owner, uint256 deadline);
    event AdFunded(uint256 postID, address from, uint256 amount);
    event AdUpdated(uint256 postID, bytes metadata);
    event AdGriefed(uint256 postID, address griefer, uint256 amount, bytes message);

    constructor(address _nmr, address _erasurePosts) public {
        nmr = _nmr;
        erasurePosts = _erasurePosts;
    }

    // ADS //

    modifier onlyPostOwner(uint256 postID) {
        require(msg.sender == Erasure_Posts(erasurePosts).getPostOwner(postID));
        _;
    }

    modifier onlyActiveAd(uint256 postID) {
        require(block.timestamp < ads[postID].deadline, "ad not active");
        _;
    }

    modifier onlyInactiveAd(uint256 postID) {
        require(block.timestamp > ads[postID].deadline, "ad still active");
        _;
    }

    function createAd(uint256 postID, uint256 deadline) public onlyPostOwner(postID) onlyInactiveAd(postID) {

        Ad storage ad = ads[postID];

        require(block.timestamp < deadline, "deadline in past");

        if (!adSet.exists(bytes32(postID))) {
            adSet.insert(bytes32(postID));
        }

        ad.deadline = deadline;

        emit AdCreated(postID, msg.sender, deadline);
    }

    function fundAd(uint256 postID, uint256 amount) public onlyActiveAd(postID) {

        Ad storage ad = ads[postID];

        require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), amount));

        ad.stake = ad.stake.add(amount);

        emit AdFunded(postID, msg.sender, amount);
    }

    function updateAd(uint256 postID, bytes memory metadata) public onlyPostOwner(postID) onlyActiveAd(postID) {

        Ad storage ad = ads[postID];

        ad.metadata = metadata;

        emit AdUpdated(postID, metadata);
    }

    function griefAd(uint256 postID, uint256 amount, bytes memory message) public onlyActiveAd(postID) {

        Ad storage ad = ads[postID];

        ERC20Burnable(nmr).burnFrom(msg.sender, amount);
        ERC20Burnable(nmr).burn(amount);

        ad.stake = ad.stake.sub(amount);

        emit AdGriefed(postID, msg.sender, amount, message);

    }

    function withdrawStake(uint256 postID) public onlyPostOwner(postID) onlyInactiveAd(postID) {

        Ad storage ad = ads[postID];

        require(ERC20Burnable(nmr).transfer(msg.sender, ad.stake));

        adSet.remove(bytes32(postID));
        delete ads[postID];
    }

}
