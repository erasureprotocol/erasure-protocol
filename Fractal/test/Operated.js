const etherlime = require("etherlime-lib");

describe("Operated", function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let contracts = {
    TestOperated: {
      artifact: require("../build/TestOperated.json")
    }
  };

  let deployer;
  beforeEach(async () => {
    deployer = new etherlime.EtherlimeGanacheDeployer(
      wallets.numerai.secretKey
    );
    contracts.TestOperated.instance = await deployer.deploy(
      contracts.TestOperated.artifact
    );
  });

  describe("Operator._setOperator", () => {
    const operator = wallets.seller.signer.signingKey.address;

    it("should setOperator correctly", async () => {
      const txn = await contracts.TestOperated.instance.setOperator(operator);
      await assert.emit(txn, "StatusUpdated");
      await assert.emitWithArgs(txn, [operator, false]);

      const actualOperator = await contracts.TestOperated.instance.getOperator();
      assert.equal(actualOperator, operator);

      const isOperator = await contracts.TestOperated.instance.isOperator(
        operator
      );
      assert.equal(isOperator, true);
    });

    it("should revert when setOperator called with same operator", async () => {
      await contracts.TestOperated.instance.setOperator(operator);
      await assert.revert(
        contracts.TestOperated.instance.setOperator(operator)
      );
    });
  });

  describe("Operator._activate", () => {
    it("should activate correctly", async () => {
      const txn = await contracts.TestOperated.instance.activate();
      await assert.emit(txn, "StatusUpdated");
      await assert.emitWithArgs(txn, [zeroAddress, true]);

      const actualIsActive = await contracts.TestOperated.instance.isActive();
      assert.equal(actualIsActive, true);
    });

    it("should revert when activate called when isActive", async () => {
      await contracts.TestOperated.instance.activate();
      await assert.revert(contracts.TestOperated.instance.activate());
    });
  });

  describe("Operator._deactivate", () => {
    it("should activate correctly", async () => {
      await contracts.TestOperated.instance.activate();

      const txn = await contracts.TestOperated.instance.deactivate();
      await assert.emit(txn, "StatusUpdated");
      await assert.emitWithArgs(txn, [zeroAddress, false]);

      const actualIsActive = await contracts.TestOperated.instance.isActive();
      assert.equal(actualIsActive, false);
    });

    it("should revert when deactivate called when not active", async () => {
      await assert.revert(contracts.TestOperated.instance.deactivate());
    });
  });

  describe("Operator.isActiveOperator", () => {
    const operator = wallets.seller.signer.signingKey.address;

    it("should get isActiveOperator=true correctly", async () => {
      await contracts.TestOperated.instance.activate();
      await contracts.TestOperated.instance.setOperator(operator);

      const isActiveOperator = await contracts.TestOperated.instance.isActiveOperator(
        operator
      );
      assert.equal(isActiveOperator, true);
    });

    it("should get isActiveOperator=false correctly", async () => {
      await contracts.TestOperated.instance.activate();

      const isActiveOperator = await contracts.TestOperated.instance.isActiveOperator(
        operator
      );
      assert.equal(isActiveOperator, false);
    });
  });
});
