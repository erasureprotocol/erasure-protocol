pragma solidity ^0.5.0;

import "./helpers/IPFSWrapper.sol";
import "./helpers/openzeppelin-solidity/math/SafeMath.sol";
import "./helpers/openzeppelin-solidity/token/ERC20/ERC20Burnable.sol";


contract ErasureNext_Posts is IPFSWrapper {

    using SafeMath for uint256;

    Post[] private posts;

    address public nmr;

    struct Post {
        IPFSMultiHash[] hashes;
        address owner;
        bytes metadata;
        uint256 stake;
        bool symmetricGrief;
    }

    event PostCreated(uint256 postID, address owner, bytes metadata, uint256 stake, bool symmetricGrief);
    event PostUpdated(uint256 postID, address owner, bytes metadata, uint256 stake, bool symmetricGrief);
    event HashSubmitted(uint256 postID, bytes proofHash);
    event PostGriefed(uint256 postID, address griefer, uint256 amount, bytes message);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // POSTS //

    function createPost(bytes memory proofHash, bytes memory metadata, uint256 stake, bool symmetricGrief) public returns (uint256 postID) {

        postID = posts.length;
        posts.length++;

        require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), stake));

        posts[postID].owner = msg.sender;
        posts[postID].metadata = metadata;
        posts[postID].stake = stake;
        posts[postID].symmetricGrief = symmetricGrief;

        submitHash(postID, proofHash);

        emit PostCreated(postID, msg.sender, metadata, stake, symmetricGrief);
    }

    function submitHash(uint256 postID, bytes memory proofHash) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.hashes.push(splitIPFSHash(proofHash));

        emit HashSubmitted(postID, proofHash);
    }

    function updatePost(uint256 postID, bytes memory metadata, uint256 stake, bool symmetricGrief) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        // not vulnerable to re-entrancy since token contract is trusted
        if (stake > post.stake)
            require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), stake - post.stake));
        if (stake < post.stake)
            require(ERC20Burnable(nmr).transfer(msg.sender, post.stake - stake));

        post.metadata = metadata;
        post.stake = stake;
        post.symmetricGrief = symmetricGrief;

        emit PostUpdated(postID, msg.sender, metadata, stake, symmetricGrief);
    }

    // known to be vulnerable to front-running
    function griefPost(uint256 postID, uint256 amount, bytes memory message) public {

        Post storage post = posts[postID];

        require(post.symmetricGrief);

        post.stake = post.stake.sub(amount);

        ERC20Burnable(nmr).burn(amount);
        ERC20Burnable(nmr).burnFrom(msg.sender, amount);

        emit PostGriefed(postID, msg.sender, amount, message);
    }

}
