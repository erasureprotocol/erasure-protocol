pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract MockNMR is IERC20 {

    using SafeMath for uint256;

    string public name = "Numeraire";
    string public symbol = "NMR";

    uint256 public decimals = 18;
    uint256 public INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    uint256 private _totalSupply;

    modifier onlyPayloadSize(uint256 numWords) {
        assert(msg.data.length == numWords * 32 + 4);
        _;
    }

    constructor () public {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mintMockTokens(address to, uint256 value) public returns (bool) {
        _mint(to, value);
        return true;
    }

    function _mint(address account, uint256 value) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);
        emit Transfer(address(0), account, value);
    }

    // ERC20

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transfer(address _to, uint256 _value) public onlyPayloadSize(2) returns (bool ok) {
        // Check for sufficient funds.
        require(_balances[msg.sender] >= _value);

        _balances[msg.sender] = _balances[msg.sender].sub(_value);
        _balances[_to] = _balances[_to].add(_value);

        // Notify anyone listening.
        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public onlyPayloadSize(3) returns (bool ok) {
        require(_from != address(this));

        // Check for sufficient funds.
        require(_balances[_from] >= _value);
        // Check for authorization to spend.
        require(_allowances[_from][msg.sender] >= _value, "insufficient allowance");

        _balances[_from] = _balances[_from].sub(_value);
        _allowances[_from][msg.sender] = _allowances[_from][msg.sender].sub(_value);
        _balances[_to] = _balances[_to].add(_value);

        // Notify anyone listening.
        emit Transfer(_from, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public onlyPayloadSize(2) returns (bool ok) {
        require((_value == 0) || (_allowances[msg.sender][_spender] == 0));
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function changeApproval(address _spender, uint256 _oldValue, uint256 _newValue) public onlyPayloadSize(3) returns (bool ok) {
        require(_allowances[msg.sender][_spender] == _oldValue);
        _allowances[msg.sender][_spender] = _newValue;
        emit Approval(msg.sender, _spender, _newValue);
        return true;
    }

    // burn
    function mint(uint256 _value) public returns (bool ok) {
        if (msg.sender == address(0))
            return false;

        if (_totalSupply < _value)
            return false;

        if (_balances[msg.sender] < _value)
            return false;

        return _burn(msg.sender, _value);
    }

    // burnFrom
    function numeraiTransfer(address _to, uint256 _value) public onlyPayloadSize(2) returns (bool ok) {
        if (_to == address(0))
            return false;

        if (_totalSupply < _value)
            return false;

        if (_balances[_to] < _value)
            return false;

        if (_allowances[_to][msg.sender] < _value)
            return false;

        return _burnFrom(_to, _value);
    }

    function _burn(address _account, uint256 _value) internal returns (bool ok) {
        _totalSupply -= _value;
        _balances[_account] -= _value;
        emit Transfer(_account, address(0), _value);
        return true;
    }

    function _burnFrom(address _account, uint256 _value) internal returns (bool ok) {
        _allowances[_account][msg.sender] -= _value;
        emit Approval(_account, msg.sender, _allowances[_account][msg.sender]);
        return _burn(_account, _value);
    }
}
