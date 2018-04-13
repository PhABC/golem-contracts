import ether from './helpers/ether';
const Web3Utils = require('web3-utils');
const eutil = require('ethereumjs-util')


const BigNumber = web3.BigNumber;

var GolemNetworkToken = artifacts.require('GolemNetworkToken');
var GolemNetworkTokenBatching = artifacts.require('GolemNetworkTokenBatching');
var GNTPaymentChannels = artifacts.require('GNTPaymentChannels');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('GNTPaymentChannels', function ([owner, anyone, Alice, Bob, Bob2]) {

  var startBlock = 1000;
  var endBlock   = 1100;

  //Hash of channel 0 & 1
  var ch0 = Web3Utils.soliditySha3(0);

  describe.only('Testing signatures from Geth client for payment channels', function() {
    beforeEach(async function () {
      //Deploying GNT token
      this.GNT = await GolemNetworkToken.new(owner, owner, startBlock, endBlock, {from : owner});

      //Deploying GNTB token contract
      this.GNTB = await GolemNetworkTokenBatching.new(this.GNT.address, {from: owner});

      //Deploying payment channgel contract
      this.paymentChannel = await GNTPaymentChannels.new(this.GNTB.address, 100000); 

      //Alice opens a channel with Bob
      await this.paymentChannel.createChannel(Bob, {from: Alice});
    });

    context('When Alice opens a payment channel with Bob and signs a VALID message (with prefix)', function () {
      var m = Web3Utils.soliditySha3(ch0, 100);
      var sign = web3.eth.sign(Alice, m);

      // Extracting ECDSA variables from signature
      const rsv = eutil.fromRpcSig(sign)
      var r = eutil.bufferToHex(rsv.r);
      var s = eutil.bufferToHex(rsv.s);
      var v = rsv.v;

      it('isValidSig() WILL return FALSE', async function () {
        var isValid = await this.paymentChannel.isValidSig(ch0, 100, v, r, s);
        isValid.should.be.equal(false);
      });

      it('isValidSigPREFIX() WILL return TRUE', async function () {
        var isValid = await this.paymentChannel.isValidSigPREFIX(ch0, 100, v, r, s);
        isValid.should.be.equal(true);
      });

      it('isValidSigBOTH() WILL return TRUE', async function () {
        var isValid = await this.paymentChannel.isValidSigBOTH(ch0, 100, v, r, s);
        isValid.should.be.equal(true);
      });

    });

  }); //Describe 1
}); //Contract
