pragma solidity ^0.4.20;

import "./open_zeppelin/BurnableToken.sol";
import "./open_zeppelin/StandardToken.sol";

import "./GNTDeposit.sol";
import "./GolemNetworkToken.sol";
import "./GolemNetworkTokenBatching.sol";


// Proxy Token that allos users to deposit GNT in GNTDeposit contract in 3 function calls instead of 4.
// 1. Open ProxyMigrateTokensAndDeposit gate
// 2. Send GNT to gate
// 3. Call migrateTokensAndDeposit() which will convert GNT to GNTB and deposit GNTB in GNTDeposit

contract ProxyMigrateTokensAndDeposit is StandardToken, BurnableToken {

  mapping(address => address) private gates;

  GNTDeposit public depositContract;     // Deposit contract
  ERC20Basic public GNT;          // GNT contract
  GolemNetworkTokenBatching public GNTB; // GNTB contract

  address public GNTBgate; // GNTB Gate associated with ProxyMigrateTokensAndDeposit

  // events
  event GateOpened(address indexed gate, address indexed user);
  event Mint(address indexed to, uint256 amount);

  //Constructor
  function ProxyMigrateTokensAndDeposit(
      GNTDeposit _depositContract,
      ERC20Basic _GNT,
      GolemNetworkTokenBatching _GNTB)
      public
  { 
    //Setting contracts
    depositContract = _depositContract;
    GNT = _GNT;
    GNTB = _GNTB;

    //Opening migration gate for proxy contract
    GNTB.openGate();

    //Save the GNTB gate address associated with MigrateTokensAndDeposit
    GNTBgate = GNTB.getGateAddress(this);
  }

  /// Create a new migration Gate for the User.
  function openGate() external returns (address) {

    // Do not allow creating more than one Gate per User.
    require(gates[msg.sender] == 0);

    // Create new Gate.
    address gate = new Gate(GNT, this);

    // Remember User - Gate relationship.
    gates[msg.sender] = gate;

    emit GateOpened(gate, msg.sender);
    return gate;
  }

  // Function that will transfer from the current proxy to the 
  // GNTB proxy contract, where GNT will be deposited to gate, 
  // converted to GNTB and deposited to GNTDeposit in a single function call.
  function migrateTokensAndDeposit(uint256 _value) public {
    require(_value > 0);

    //User's MigrateTokensAndDeposit's gate 
    address gate = gates[msg.sender];
    require(gate != 0);
    
    //Gate balance
    uint256 gateBalance = GNT.balanceOf(gate);
    require(_value <= gateBalance);

    //Transfer from gate to MigrateTokensAndDeposit Proxy
    Gate(gate).transferToProxy(_value);

    //Send GNT to GNTB gate
    GNT.transfer(GNTBgate, _value);

    //Convert GNT to GNTB
    GNTB.transferFromGate();

    //Deposit GNTB to GNTDeposit contract
    GNTB.transferAndCall(depositContract, _value, '0x');

    // Keep track of how much each users using the MigrateTokensAndDeposit proxy
    // contract has deposited in GNTDeposit.
    totalSupply_ += _value;
    balances[msg.sender] += _value;

    emit Mint(msg.sender, _value);
  }

  // Function that will unlock GNTB tokens from deposit contract for user
  function unlockDeposit() public {
    //Unlocking tokens 
    depositContract.unlock();
  }


}