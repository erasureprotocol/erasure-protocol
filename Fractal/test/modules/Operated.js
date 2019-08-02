const { createDeployer } = require("../helpers/setup");

describe("Operated", function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    TestOperated: {
      artifact: require("../../build/TestOperated.json")
    }
  };

  let deployer;
  before(() => {
    deployer = createDeployer();
  });

  beforeEach(async () => {
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
      await assert.revertWith(
        contracts.TestOperated.instance.setOperator(operator),
        "same operator set"
      );
    });
  });

  describe("Operator._activate", () => {
    it("should activate correctly", async () => {
      const txn = await contracts.TestOperated.instance.activate();
      await assert.emit(txn, "StatusUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, true]);

      const actualIsActive = await contracts.TestOperated.instance.isActive();
      assert.equal(actualIsActive, true);
    });

    it("should revert when activate called when isActive", async () => {
      await contracts.TestOperated.instance.activate();
      await assert.revertWith(
        contracts.TestOperated.instance.activate(),
        "already active"
      );
    });
  });

  describe("Operator._deactivate", () => {
    it("should activate correctly", async () => {
      await contracts.TestOperated.instance.activate();

      const txn = await contracts.TestOperated.instance.deactivate();
      await assert.emit(txn, "StatusUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, false]);

      const actualIsActive = await contracts.TestOperated.instance.isActive();
      assert.equal(actualIsActive, false);
    });

    it("should revert when deactivate called when not active", async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.deactivate(),
        "already deactivated"
      );
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
