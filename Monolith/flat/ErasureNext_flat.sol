pragma solidity ^0.5.0;

/**
 * @title SafeMath
 * @dev Unsigned math operations with safety checks that revert on error.
 */
library SafeMath {
    /**
     * @dev Multiplies two unsigned integers, reverts on overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Integer division of two unsigned integers truncating the quotient, reverts on division by zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Adds two unsigned integers, reverts on overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Divides two unsigned integers and returns the remainder (unsigned integer modulo),
     * reverts when dividing by zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}


/**
 * @title ERC20 interface
 * @dev see https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}



/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * https://eips.ethereum.org/EIPS/eip-20
 * Originally based on code by FirstBlood:
 * https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 *
 * This implementation emits additional Approval events, allowing applications to reconstruct the allowance status for
 * all accounts just by listening to said events. Note that this isn't required by the specification, and other
 * compliant implementations may not do it.
 */
contract ERC20 is IERC20 {
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    /**
     * @dev Total number of tokens in existence.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Gets the balance of the specified address.
     * @param owner The address to query the balance of.
     * @return A uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param owner address The address which owns the funds.
     * @param spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev Transfer token to a specified address.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function transfer(address to, uint256 value) public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     */
    function approve(address spender, uint256 value) public returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another.
     * Note that while this function emits an Approval event, this is not required as per the specification,
     * and other compliant implementations may not emit the event.
     * @param from address The address which you want to send tokens from
     * @param to address The address which you want to transfer to
     * @param value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        _transfer(from, to, value);
        _approve(from, msg.sender, _allowances[from][msg.sender].sub(value));
        return true;
    }

    /**
     * @dev Increase the amount of tokens that an owner allowed to a spender.
     * approve should be called when _allowances[msg.sender][spender] == 0. To increment
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * Emits an Approval event.
     * @param spender The address which will spend the funds.
     * @param addedValue The amount of tokens to increase the allowance by.
     */
    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].add(addedValue));
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner allowed to a spender.
     * approve should be called when _allowances[msg.sender][spender] == 0. To decrement
     * allowed value is better to use this function to avoid 2 calls (and wait until
     * the first transaction is mined)
     * From MonolithDAO Token.sol
     * Emits an Approval event.
     * @param spender The address which will spend the funds.
     * @param subtractedValue The amount of tokens to decrease the allowance by.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender].sub(subtractedValue));
        return true;
    }

    /**
     * @dev Transfer token for a specified addresses.
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ERC20: transfer to the zero address");

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }

    /**
     * @dev Internal function that mints an amount of the token and assigns it to
     * an account. This encapsulates the modification of balances such that the
     * proper events are emitted.
     * @param account The account that will receive the created tokens.
     * @param value The amount that will be created.
     */
    function _mint(address account, uint256 value) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);
        emit Transfer(address(0), account, value);
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account.
     * @param account The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function _burn(address account, uint256 value) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _totalSupply = _totalSupply.sub(value);
        _balances[account] = _balances[account].sub(value);
        emit Transfer(account, address(0), value);
    }

    /**
     * @dev Approve an address to spend another addresses' tokens.
     * @param owner The address that owns the tokens.
     * @param spender The address that will spend the tokens.
     * @param value The number of tokens that can be spent.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account, deducting from the sender's allowance for said account. Uses the
     * internal burn function.
     * Emits an Approval event (reflecting the reduced allowance).
     * @param account The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function _burnFrom(address account, uint256 value) internal {
        _burn(account, value);
        _approve(account, msg.sender, _allowances[account][msg.sender].sub(value));
    }
}


/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract ERC20Burnable is ERC20 {
    /**
     * @dev Burns a specific amount of tokens.
     * @param value The amount of token to be burned.
     */
    function burn(uint256 value) public {
        _burn(msg.sender, value);
    }

    /**
     * @dev Burns a specific amount of tokens from the target address and decrements allowance.
     * @param from address The account whose tokens will be burned.
     * @param value uint256 The amount of token to be burned.
     */
    function burnFrom(address from, uint256 value) public {
        _burnFrom(from, value);
    }
}



// one to many relationship between Post and Agreement

contract ErasureNext_Monolith {

    using SafeMath for uint256;

    User[] public users;
    Post[] public posts;
    Agreement[] public agreements;

    address public nmr;

    enum GriefType { CgtP, CltP, CeqP, InfGreif, NoGreif }
    enum State { Pending, Accepted, Ended }

    struct User {
        address user;
        bytes metadata;
        uint256 stake;
        bool symmetricGrief;
    }

    struct Post {
        bytes32[] hashes;
        address owner;
        bytes metadata;
        uint256 stake;
        bool symmetricGrief;
    }

    struct Agreement {
        bytes metadata;
        address buyer;
        address seller;
        bool buyerProposed;
        uint256 price;
        uint256 buyerStake;
        uint256 sellerStake;
        uint256 buyerGriefCost;
        uint256 sellerGriefCost;
        uint256 griefDeadline;
        GriefType buyerGriefType;
        GriefType sellerGriefType;
        State status;
    }

    event UserCreated(uint256 userID, address user, bytes metadata, uint256 stake, bool symmetricGrief);
    event UserUpdated(uint256 userID, address user, bytes metadata, uint256 stake, bool symmetricGrief);
    event UserGriefed(uint256 userID, address griefer, uint256 amount);
    event PostCreated(uint256 postID, address owner, bytes metadata, uint256 stake, bool symmetricGrief);
    event PostUpdated(uint256 postID, address owner, bytes metadata, uint256 stake, bool symmetricGrief);
    event HashSubmitted(uint256 postID, bytes32 proofHash);
    event PostGriefed(uint256 postID, address griefer, uint256 amount);
    event AgreementProposed(
        uint256 agreementID,
        bytes metadata,
        address buyer,
        address seller,
        bool buyerProposed,
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    );
    event AgreementAccepted(uint256 agreementID);
    event AgreementGriefed(uint256 agreementID, address griefer, uint256 cost, uint256 punishment);
    event AgreementEnded(uint256 agreementID);

    constructor(address _nmr) public {
        nmr = _nmr;
    }

    // USERS //

    function createUser(bytes memory metadata, uint256 stake, bool symmetricGrief) public returns (uint256 userID) {

        userID = users.length;

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), stake));

        users.push(User(msg.sender, metadata, stake, symmetricGrief));

        emit UserCreated(userID, msg.sender, metadata, stake, symmetricGrief);
    }

    function updateUser(uint256 userID, bytes memory metadata, uint256 stake, bool symmetricGrief) public {

        User storage user = users[userID];

        require(msg.sender == user.user, "only user");

        // not vulnerable to re-entrancy since token contract is trusted
        if (stake > user.stake)
            require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), stake - user.stake));
        if (stake < user.stake)
            require(ERC20Burnable(nmr).transfer(msg.sender, user.stake - stake));

        user.metadata = metadata;
        user.stake = stake;
        user.symmetricGrief = symmetricGrief;

        emit UserUpdated(userID, msg.sender, metadata, stake, symmetricGrief);
    }

    // known to be vulnerable to front-running
    function griefUser(uint256 userID, uint256 amount) public {

        User storage user = users[userID];

        require(user.symmetricGrief);

        user.stake = user.stake.sub(amount);

        ERC20Burnable(nmr).burn(amount);
        ERC20Burnable(nmr).burnFrom(msg.sender, amount);

        emit UserGriefed(userID, msg.sender, amount);
    }

    // POSTS //

    function createPost(bytes32 proofHash, bytes memory metadata, uint256 stake, bool symmetricGrief) public returns (uint256 postID) {

        postID = posts.length;

        require(ERC20Burnable(nmr).transferFrom(msg.sender, address(this), stake));

        bytes32[] memory hashes;

        posts.push(Post(hashes, msg.sender, metadata, stake, symmetricGrief));

        submitHash(postID, proofHash);

        emit PostCreated(postID, msg.sender, metadata, stake, symmetricGrief);
    }

    function submitHash(uint256 postID, bytes32 proofHash) public {

        Post storage post = posts[postID];

        require(msg.sender == post.owner, "only owner");

        post.hashes.push(proofHash);

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
    function griefPost(uint256 postID, uint256 amount) public {

        Post storage post = posts[postID];

        require(post.symmetricGrief);

        post.stake = post.stake.sub(amount);

        ERC20Burnable(nmr).burn(amount);
        ERC20Burnable(nmr).burnFrom(msg.sender, amount);

        emit PostGriefed(postID, msg.sender, amount);
    }

    // AGREEMENTS //

    function proposeAgreement(
        bool isBuyer,
        address counterparty,
        bytes memory metadata,
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) public returns (uint256 agreementID){

        if (isBuyer) {
            agreementID = pushProposal(
                metadata,
                msg.sender,
                counterparty,
                isBuyer,
                price,
                buyerStake,
                sellerStake,
                buyerGriefCost,
                sellerGriefCost,
                griefDeadline,
                buyerGriefType,
                sellerGriefType
            );
        } else {
            agreementID = pushProposal(
                metadata,
                counterparty,
                msg.sender,
                isBuyer,
                price,
                buyerStake,
                sellerStake,
                buyerGriefCost,
                sellerGriefCost,
                griefDeadline,
                buyerGriefType,
                sellerGriefType
            );
        }


    }

    function pushProposal(
        bytes memory metadata,
        address buyer,
        address seller,
        bool isBuyer,
        uint256 price,
        uint256 buyerStake,
        uint256 sellerStake,
        uint256 buyerGriefCost,
        uint256 sellerGriefCost,
        uint256 griefDeadline,
        GriefType buyerGriefType,
        GriefType sellerGriefType
    ) private returns (uint256 agreementID) {

        agreementID = agreements.length;

        agreements.push(Agreement(
            metadata,
            buyer,
            seller,
            isBuyer,
            price,
            buyerStake,
            sellerStake,
            buyerGriefCost,
            sellerGriefCost,
            griefDeadline,
            buyerGriefType,
            sellerGriefType,
            State.Pending
        ));

        emit AgreementProposed(
            agreementID,
            metadata,
            buyer,
            seller,
            isBuyer,
            price,
            buyerStake,
            sellerStake,
            buyerGriefCost,
            sellerGriefCost,
            griefDeadline,
            buyerGriefType,
            sellerGriefType
        );
    }

    function acceptAgreement(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        if (agreement.buyerProposed)
            require(msg.sender == agreement.seller, "only seller");
        else
            require(msg.sender == agreement.buyer, "only seller");

        require(agreement.status == State.Pending, "only pending");

        // transfer price
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer, agreement.seller, agreement.price));

        // transfer stakes
        require(ERC20Burnable(nmr).transferFrom(agreement.seller, address(this), agreement.sellerStake));
        require(ERC20Burnable(nmr).transferFrom(agreement.buyer, address(this), agreement.buyerStake));

        emit AgreementAccepted(agreementID);
    }

    function griefAgreement(uint256 agreementID, uint256 punishment) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");

        uint256 cost;

        if (msg.sender == agreement.seller) {
            cost = getGriefCost(agreement.sellerGriefCost, punishment, agreement.sellerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(cost);
            agreement.buyerStake = agreement.buyerStake.sub(punishment);
        } else {
            cost = getGriefCost(agreement.buyerGriefCost, punishment, agreement.buyerGriefType);

            agreement.sellerStake = agreement.sellerStake.sub(punishment);
            agreement.buyerStake = agreement.buyerStake.sub(cost);
        }

        ERC20Burnable(nmr).burn(punishment.add(cost));

        emit AgreementGriefed(agreementID, msg.sender, cost, punishment);
    }

    function endAgreement(uint256 agreementID) public {

        Agreement storage agreement = agreements[agreementID];

        require(msg.sender == agreement.seller || msg.sender == agreement.buyer, "only seller or buyer");
        require(now > agreement.griefDeadline, "only after grief deadline");

        // not vulnerable to re-entrancy since token contract is trusted
        require(ERC20Burnable(nmr).transfer(agreement.seller, agreement.sellerStake));
        require(ERC20Burnable(nmr).transfer(agreement.buyer, agreement.buyerStake));

        delete agreement.sellerStake;
        delete agreement.buyerStake;

        emit AgreementEnded(agreementID);
    }

    function getGriefCost(uint256 ratio, uint256 punishment, GriefType griefType) public pure returns(uint256 cost) {
        /*
            CgtP: Cost greater than Punishment
            CltP: Cost less than Punishment
            CeqP: Cost equal to Punishment
            InfGrief: Punishment at no cost
            NoGrief: No Punishment
        */
        if (griefType == GriefType.CgtP)
            return punishment.mul(ratio);
        if (griefType == GriefType.CltP)
            return punishment.div(ratio);
        if (griefType == GriefType.CeqP)
            return punishment;
        if (griefType == GriefType.InfGreif)
            return 0;
        if (griefType == GriefType.NoGreif)
            revert();
    }

}
