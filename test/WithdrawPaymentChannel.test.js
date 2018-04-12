import ether from './helpers/ether';
const Web3Utils = require('web3-utils');
const eutil = require('ethereumjs-util')


const BigNumber = web3.BigNumber;

var GolemNetworkToken = artifacts.require('GolemNetworkToken');
var GolemNetworkTokenBatching = artifacts.require('GolemNetworkTokenBatching');
var GNTDeposit = artifacts.require('GNTDeposit');
var ProxyMigrateTokensAndDeposit = artifacts.require('ProxyMigrateTokensAndDeposit');
var GNTFaucet = artifacts.require('Faucet');
var GNTPaymentChannels = artifacts.require('GNTPaymentChannels');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ProxyDepositContract', function ([owner, anyone, Alice, Bob, Bob2]) {

  var startBlock = 1000;
  var endBlock   = 1100;

  var amountToken = ether(1000);

  //Hash of channel 0 & 1
  var ch0 = Web3Utils.soliditySha3(0);
  var ch1 = Web3Utils.soliditySha3(1);

  describe.only('Testing Proxy contract trying to deposit GNT in GNTDeposit', function() {
    beforeEach(async function () {
      //Deploying GNT token
      this.GNT = await GolemNetworkToken.new(owner, owner, startBlock, endBlock, {from : owner});

      //Send tokens to Alice since owner has 1,000,000 tokens
      await this.GNT.transfer(Alice, amountToken, {from: owner});
      await this.GNT.transfer(Bob, amountToken, {from: owner});

      //Deploying GNTB token contract
      this.GNTB = await GolemNetworkTokenBatching.new(this.GNT.address, {from: owner});

      //Deploying GNTDeposit contract
      this.deposit = await GNTDeposit.new(this.GNTB.address, owner, owner, 120, {from: owner});

      //Deploying ProxyMigrateTokensAndDeposit contract
      this.proxyMigrateTokensAndDeposit = await ProxyMigrateTokensAndDeposit.new(
            this.deposit.address,
            this.GNT.address,
            this.GNTB.address,
            {from: owner});

      //Deploying payment channgel contract
      this.paymentChannel = await GNTPaymentChannels.new(this.GNTB.address, 100000); 

      //Owner sends GNTB tokens to Alice, Bob and Bob2 (Bob's second account)
      await this.GNTB.transfer(Alice, amountToken, {from: owner});
      await this.GNTB.transfer(Bob, amountToken, {from: owner});
      await this.GNTB.transfer(Bob2, amountToken, {from: owner});

      //Alice opens a channel with Bob
      await this.paymentChannel.createChannel(Bob, {from: Alice});
      await this.GNTB.approve(this.paymentChannel.address, amountToken, {from: Alice});

      // Alice funds channel 0 
      await this.paymentChannel.fund(ch0, amountToken, {from: Alice});

      //Bob opens payment channel with Bob2 but doesn't fund it
      await this.paymentChannel.createChannel(Bob2, {from: Bob});
    });

    context('once all contracts are deployed and Alice opened + funded a channel with Bob', function () {
      it('Payment channel 0 should have Alice as owner', async function () {
        var owner = await this.paymentChannel.getOwner(ch0);
        owner.should.be.equal(Alice);
      });

      it('Payment channel 0 should have Bob as receiver', async function () {
        var receiver = await this.paymentChannel.getReceiver(ch0);
        receiver.should.be.equal(Bob);
      });

      it('Channel 0 should be funded', async function () {
        var ch0Balance =  await this.paymentChannel.getDeposited(ch0);
        ch0Balance.should.be.bignumber.equal(amountToken);
      });

      it('GNTPaymentChannels balance should be the amount Alice deposited', async function () {
        var contractBalance = await this.GNTB.balanceOf(this.paymentChannel.address);
        contractBalance.should.be.bignumber.equal(amountToken);
      });

        it('', async function () {
          //
        });

      context.only('ATTACK : Bob signs a message allowing Bob2 to withdraw tokens from their empty channel', function () {
        var m = Web3Utils.soliditySha3(ch1, amountToken);
        var sign = web3.eth.sign(Bob, m);

        // Extracting ECDSA variables from signature
        const rsv = eutil.fromRpcSig(sign)
        var r = eutil.bufferToHex(rsv.r);
        var s = eutil.bufferToHex(rsv.s);
        var v = rsv.v;

        beforeEach(async function (){
          //
        });

        it('Payment channel 1 should have Bob as owner', async function () {
          var owner = await this.paymentChannel.getOwner(ch1);
          owner.should.be.equal(Bob);
        });

        it('Payment channel 1 should have Bob2 as receiver', async function () {
          var receiver = await this.paymentChannel.getReceiver(ch1);
          receiver.should.be.equal(Bob2);
        });

        it('Channel 1 should NOT be funded', async function () {
          var ch1Balance =  await this.paymentChannel.getDeposited(ch1);
          ch1Balance.should.be.bignumber.equal(0);
        });

        it('signature should be valid', async function () {
          var isValid = await this.paymentChannel.isValidSig(ch1, amountToken, v, r, s);
          isValid.should.be.equal(true);
        });

        it('', async function () {
          //
        });

      });
    });

  }); //Describe 1
}); //Contract
