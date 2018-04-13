import ether from './helpers/ether';
const Web3Utils = require('web3-utils');
const eutil = require('ethereumjs-util')


const BigNumber = web3.BigNumber;

var GolemNetworkToken = artifacts.require('GolemNetworkToken');
var FaucetVacuum = artifacts.require('FaucetVacuum');
var Faucet = artifacts.require('Faucet');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('Faucet', function ([owner, anyone, Alice, Bob, Bob2]) {

  var startBlock = 1000;
  var endBlock   = 1100;

  var nIterationsToEmpty = 1000; // 1,000,000,000 / 1,000

  describe('Attack : Emptying faucet', function() {
    beforeEach(async function () {
      // Deploying GNT token
      this.GNT = await GolemNetworkToken.new(owner, owner, startBlock, endBlock, {from : owner});

      // Deploying Faucet
      this.faucet = await Faucet.new(this.GNT.address);

      // Send 1 total supply to faucet
      await this.GNT.transfer(this.faucet.address, ether(1000000000), {from: owner});

      // Deploy faucet vacuum contract
      this.faucetVacuum = await FaucetVacuum.new(this.GNT.address, this.faucet.address);
    });

    context('When Alice opens a payment channel with Bob and signs a VALID message (with prefix)', function () {

      it('faucet is empty', async function () {

          var userBalanceA = await web3.eth.getBalance(owner);
          console.log(userBalanceA);

          // Empty faceut with gas price as 1 Gwei  
          await this.faucetVacuum.vacuum(nIterationsToEmpty, 
                  {from: owner, gasPrice: 1000000000, gas: userBalanceA.div(1000000000)}); 

          //Faucet GNT balance
          var faucetBalance = await this.GNT.balanceOf(this.faucet.address);
          console.log('faucetBalance:', faucetBalance);

          //User ETH balance
          var userBalanceB = await web3.eth.getBalance(owner);
          console.log(userBalanceB);


      });

    });

  }); //Describe 1
}); //Contract
