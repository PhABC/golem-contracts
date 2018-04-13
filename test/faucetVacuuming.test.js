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

  var nIterationsToEmpty = 1000000; // 1,000,000,000 / 1,000
  var nIterationPerTx = 100;

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

    context('Calling faucetVacuun once with 100 iterations', function () {

      // Gas use for the vacuum call
      var gasUsed;

      beforeEach(async function (){        
        // Empty faceut with gas price as 1 Gwei  
        let tx = await this.faucetVacuum.vacuum(nIterationPerTx, 
                     {from: owner, gasPrice: 1000000000, gas: 6999661});
        gasUsed = tx.receipt.gasUsed;
      });

      it('Fits in a rinkeby block with gas limit of 6999661', async function () {
        gasUsed.should.be.lessThan(6999661);
      });

      it('Cost to empty faucet with gas price of 1 - 3 GWei', async function () {
        //
      });

      it('', function () {
        var numberOfTxToEmptyFaucet = nIterationsToEmpty / nIterationPerTx;
        var GweiInETH = 0.000000001;

        var costToEmptyFaucet = gasUsed * GweiInETH * numberOfTxToEmptyFaucet;
        console.log('           Cost to empty faucet:', ~~costToEmptyFaucet, 
                    'ETH -', ~~costToEmptyFaucet*3, 'ETH');
      });

    });

  }); //Describe 1
}); //Contract
