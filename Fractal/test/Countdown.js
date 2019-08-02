const { createDeployer } = require("./helpers/setup");

describe("Countdown", function() {
  let wallets = {
    numerai: accounts[0],
    seller: accounts[1],
    buyer: accounts[2]
  };

  let contracts = {
    TestCountdown: {
      artifact: require("../build/TestCountdown.json")
    }
  };

  let deployer;
  before(() => {
    deployer = createDeployer();
  });

  beforeEach(async () => {
    contracts.TestCountdown.instance = await deployer.deploy(
      contracts.TestCountdown.artifact
    );
  });

  describe("Deadline._setDeadline", () => {
    it("sets deadline correctly", async () => {
      const date = new Date();
      const timestamp = Math.round(date.getTime() / 1000);

      const txn = await contracts.TestCountdown.instance.setDeadline(timestamp);
      await assert.emit(txn, "DeadlineSet");
      await assert.emitWithArgs(txn, [timestamp]);

      const actualDeadline = await contracts.TestCountdown.instance.getDeadline();
      assert.equal(actualDeadline, timestamp);
    });
  });

  describe("Deadline.getDeadline", () => {
    it("gets deadline as 0 when deadline not set", async () => {
      const deadline = await contracts.TestCountdown.instance.getDeadline();
      assert.equal(deadline, 0);
    });
  });

  describe("Deadline._isAfterDeadline", () => {
    it("should be false if deadline not set", async () => {
      const isAfterDeadline = await contracts.TestCountdown.instance.isAfterDeadline();
      assert.equal(isAfterDeadline, false);
    });

    it("checks is after deadline", async () => {
      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      // test exceed deadline, 2000 (current time) > 1000 (deadline)
      await contracts.TestCountdown.instance.setDeadline(blockTimestamp + 1000);
      await utils.setTimeTo(deployer.provider, blockTimestamp + 2000);
      let isAfterDeadline = await contracts.TestCountdown.instance.isAfterDeadline();
      assert.equal(isAfterDeadline, true);

      // test before deadline, 3000 (current time) < 4000 (deadline)
      await contracts.TestCountdown.instance.setDeadline(blockTimestamp + 4000);
      await utils.setTimeTo(deployer.provider, blockTimestamp + 3000);
      isAfterDeadline = await contracts.TestCountdown.instance.isAfterDeadline();
      assert.equal(isAfterDeadline, false);
    });
  });

  describe("Countdown._setLength", () => {
    it("sets length correctly", async () => {
      const length = 1000;
      const txn = await contracts.TestCountdown.instance.setLength(length);
      await assert.emit(txn, "LengthSet");
      await assert.emitWithArgs(txn, [length]);

      const actualLength = await contracts.TestCountdown.instance.getLength();
      assert.equal(actualLength, length);
    });
  });

  describe("Countdown._start", () => {
    it("reverts when length not set", async () => {
      await assert.revertWith(
        contracts.TestCountdown.instance.start(),
        "length not set"
      );
    });

    it("starts countdown correctly", async () => {
      const length = 1000;
      await contracts.TestCountdown.instance.setLength(length);

      const txn = await contracts.TestCountdown.instance.start();
      await assert.emit(txn, "DeadlineSet");
    });
  });

  describe("Countdown.isOver", () => {
    it("should get isOver as false when length not set", async () => {
      let isOver = await contracts.TestCountdown.instance.isOver();
      assert.equal(isOver, false);
    });

    it("gets isOver status correctly", async () => {
      const length = 2000;
      await contracts.TestCountdown.instance.setLength(length);
      await contracts.TestCountdown.instance.start();

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      // check that it's not over
      await utils.setTimeTo(deployer.provider, blockTimestamp + 1000);
      let isOver = await contracts.TestCountdown.instance.isOver();
      assert.equal(isOver, false);

      // check that it's over
      await utils.setTimeTo(deployer.provider, blockTimestamp + 3000);
      isOver = await contracts.TestCountdown.instance.isOver();
      assert.equal(isOver, true);
    });
  });

  describe("Countdown.timeRemaining", () => {
    it("should get timeRemaining as 0 when deadline not set", async () => {
      const timeRemaining = await contracts.TestCountdown.instance.timeRemaining();
      assert.equal(timeRemaining, 0);
    });

    it("gets timeRemaining correctly before deadline", async () => {
      const length = 2000;
      const increment = 1000;
      await contracts.TestCountdown.instance.setLength(length);
      await contracts.TestCountdown.instance.start();

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      await utils.setTimeTo(deployer.provider, blockTimestamp + increment);
      const timeRemaining = await contracts.TestCountdown.instance.timeRemaining();
      assert.isAtMost(timeRemaining.toNumber(), length - increment);
    });

    it("gets timeRemaining as 0 correctly after deadline", async () => {
      const length = 2000;
      const increment = 3000;
      await contracts.TestCountdown.instance.setLength(length);
      await contracts.TestCountdown.instance.start();

      const block = await deployer.provider.getBlock("latest");
      const blockTimestamp = block.timestamp;

      await utils.setTimeTo(deployer.provider, blockTimestamp + increment);
      const timeRemaining = await contracts.TestCountdown.instance.timeRemaining();
      assert.equal(timeRemaining.toNumber(), 0);
    });
  });
});
