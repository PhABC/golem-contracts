pragma solidity ^0.4.18;

import "./GolemNetworkToken.sol";
import "./Faucet.sol";

/* Holds all tGNT after simulated crowdfunding on testnet. */
/* To receive some tGNT just call create. */
contract FaucetVacuum {
    GolemNetworkToken public token;
    Faucet public faucet;

    uint256 creationAmount;

    function FaucetVacuum(address _token, address _faucet) {
        token  = GolemNetworkToken(_token);
        faucet = Faucet(_faucet);

        creationAmount = 1000 * 10 ** uint256(token.decimals());
    }


    function vacuum(uint32 _nIterations) public {
      for(uint32 i = 0; i < _nIterations; i++){
        faucet.create();
        token.transfer(0x0, creationAmount);
      }
    }

    // Note that this function does not actually create tGNT!
    // Name was unchanged not to break API
    function create() external {
      uint256 tokens = 1000 * 10 ** uint256(token.decimals());
      if (token.balanceOf(msg.sender) >= tokens) revert();
      token.transfer(msg.sender, tokens);
    }
}
