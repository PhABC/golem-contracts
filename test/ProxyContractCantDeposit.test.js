import ether from './helpers/ether';

const BigNumber = web3.BigNumber;

var GolemNetworkToken = artifacts.require('GolemNetworkToken');
var GolemNetworkTokenBatching = artifacts.require('GolemNetworkTokenBatching');
var GNTDeposit = artifacts.require('GNTDeposit');
var ProxyMigrateTokensAndDeposit = artifacts.require('ProxyMigrateTokensAndDeposit');
var GNTFaucet = artifacts.require('Faucet');


require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ProxyDepositContract', function ([owner, anyone, Alice, Bob]) {

  var startBlock = 1000;
  var endBlock   = 1100;

  var amountToken = ether(1000);

  describe('Testing Proxy contract trying to deposit GNT in GNTDeposit', function() {
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

      // Alice opens gate on ProxyMigrateTokensAndDeposit contract
      var txgate = await this.proxyMigrateTokensAndDeposit.openGate({from: Alice});
      var gate = txgate.logs[0].args['gate'];

      // Alice sends all thheir GNT to ProxyMigrateTokensAndDeposit gate
      await this.GNT.transfer(gate, amountToken, {from: Alice});

      // Alice calls migrateTokensAndDeposit()
      await this.proxyMigrateTokensAndDeposit.migrateTokensAndDeposit(amountToken, {from: Alice});
    });

    context('once all contracts are deployed and Alice has GNT tokens', function () {

      describe('When Alice calls migrateTokensAndDeposit()', function () {
        it('it should deposit Alice GNTB in GNTDeposit contract', async function () {
          var depositBalance = await this.deposit.balanceOf(this.proxyMigrateTokensAndDeposit.address);
          depositBalance.should.be.bignumber.equal(amountToken);
        });

        it('it should update Alice balance on the proxyMigrateTokensAndDeposit contract', async function () {
          var aliceProxyBalance = await this.proxyMigrateTokensAndDeposit.balanceOf(Alice);
          aliceProxyBalance.should.be.bignumber.equal(amountToken);
        });

        context('If Alice tries to unlock the tokens on the  GNT Deposit contract via Proxy', function () {
          beforeEach(async function (){
            //Unlocking tokens on deposit contract to withdraw
            await this.proxyMigrateTokensAndDeposit.unlockDeposit({from: Alice});
          });

          it('it should set isLocked to false', async function () {
            var isLocked = await this.deposit.isLocked(this.proxyMigrateTokensAndDeposit.address);
            isLocked.should.be.equal(false);
          });

          context('But if Bob also calls migrateTokensAndDeposit()', function (){

            beforeEach(async function () { 
              // Bob opens gate on ProxyMigrateTokensAndDeposit contract
              var txgate = await this.proxyMigrateTokensAndDeposit.openGate({from: Bob});
              var gate = txgate.logs[0].args['gate'];

              // Bob sends all thheir GNT to ProxyMigrateTokensAndDeposit gate
              await this.GNT.transfer(gate, amountToken, {from: Bob});

              //Bob calls migrateTokensAndDeposit()
              await this.proxyMigrateTokensAndDeposit.migrateTokensAndDeposit(amountToken, {from: Bob});
            });

            it('Alice tokens will be locked again (they use same proxy contract)', async function () {
                var isLocked = await this.deposit.isLocked(this.proxyMigrateTokensAndDeposit.address);
                isLocked.should.be.equal(true);
            });
          });
        });
      });
    });
  });
});
