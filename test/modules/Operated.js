const { createDeployer } = require("../helpers/setup");

describe("Operated", function () {
  const [operatorWallet, newOperatorWallet] = accounts;
  const operator = operatorWallet.signer.signingKey.address;
  const newOperator = newOperatorWallet.signer.signingKey.address;

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

  // state functions

  describe("Operator._setOperator", () => {
    it("should setOperator correctly", async () => {
      const txn = await contracts.TestOperated.instance.setOperator(operator);
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [operator, false]);

      const actualOperator = await contracts.TestOperated.instance.getOperator();
      assert.equal(actualOperator, operator);

      const isOperator = await contracts.TestOperated.instance.testIsOperator(
        operator
      );
      assert.equal(isOperator, true);
    });

    it("should revert when setOperator called with same operator", async () => {
      await contracts.TestOperated.instance.setOperator(operator);
      await assert.revertWith(
        contracts.TestOperated.instance.setOperator(operator),
        "cannot set same operator"
      );
    });
  });

  describe("Operator._activateOperator", () => {
    it("should activate correctly", async () => {
      const txn = await contracts.TestOperated.instance.activateOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, true]);

      const actualIsActive = await contracts.TestOperated.instance.getOperatorStatus();
      assert.equal(actualIsActive, true);
    });

    it("should revert when activateOperator called when operator is already active", async () => {
      await contracts.TestOperated.instance.activateOperator();
      await assert.revertWith(
        contracts.TestOperated.instance.activateOperator(),
        "only when operator not active"
      );
    });
  });

  describe("Operator._deactivateOperator", () => {
    it("should deactivateOperator correctly with zero address", async () => {
      await contracts.TestOperated.instance.activateOperator();

      const txn = await contracts.TestOperated.instance.deactivateOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, false]);

      const actualIsActive = await contracts.TestOperated.instance.getOperatorStatus();
      assert.equal(actualIsActive, false);
    });

    it("should deactivateOperator correctly with active operator", async () => {
      await contracts.TestOperated.instance.setOperator(operator);
      await contracts.TestOperated.instance.activateOperator();

      const txn = await contracts.TestOperated.instance.deactivateOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [operator, false]);

      const actualIsActive = await contracts.TestOperated.instance.getOperatorStatus();
      assert.equal(actualIsActive, false);
    });

    it("should revert when deactivateOperator called when operator not active", async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.deactivateOperator(),
        "only when operator active"
      );
    });
  });

  describe("Operator._transferOperator", () => {
    it("should transfer operator correctly", async () => {
      await contracts.TestOperated.instance.setOperator(operator);

      const txn = await contracts.TestOperated.instance.transferOperator(
        newOperator
      );
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [newOperator, false]);

      const actualOperator = await contracts.TestOperated.instance.getOperator();
      assert.equal(actualOperator, newOperator);

      const isOperator = await contracts.TestOperated.instance.testIsOperator(
        newOperator
      );
      assert.equal(isOperator, true);
    });

    it("should revert when no operator was set", async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.transferOperator(newOperator),
        "operator not set"
      );
    });

    // other revert cases are covered in Operated._setOperator tests already
  });

  describe("Operator._renounceOperator", () => {
    it("should renounce operator correctly", async () => {
      await contracts.TestOperated.instance.activateOperator();

      const txn = await contracts.TestOperated.instance.renounceOperator();
      await assert.emit(txn, "OperatorUpdated");
      await assert.emitWithArgs(txn, [ethers.constants.AddressZero, false]);

      const actualOperator = await contracts.TestOperated.instance.getOperator();
      assert.equal(actualOperator, ethers.constants.AddressZero);

      const status = await contracts.TestOperated.instance.getOperatorStatus();
      assert.equal(status, false);
    });

    it("should revert when operator is not active", async () => {
      await contracts.TestOperated.instance.activateOperator();

      await contracts.TestOperated.instance.deactivateOperator();

      await assert.revertWith(
        contracts.TestOperated.instance.renounceOperator(),
        "only when operator active"
      );
    });

    it("should revert when no operator is set", async () => {
      await assert.revertWith(
        contracts.TestOperated.instance.renounceOperator(),
        "only when operator active"
      );
    });
  });

  // view functions

  describe("Operator.isActiveOperator", () => {
    it("should get isActiveOperator=true correctly", async () => {
      await contracts.TestOperated.instance.activateOperator();
      await contracts.TestOperated.instance.setOperator(operator);

      const isActiveOperator = await contracts.TestOperated.instance.testIsActiveOperator(
        operator
      );
      assert.equal(isActiveOperator, true);
    });

    it("should get isActiveOperator=false correctly", async () => {
      await contracts.TestOperated.instance.activateOperator();

      const isActiveOperator = await contracts.TestOperated.instance.testIsActiveOperator(
        operator
      );
      assert.equal(isActiveOperator, false);
    });
  });
});
