const ethers = require("ethers");
const { createDeployer } = require("../helpers/setup");
const { hexlify } = require("../helpers/utils");
const ErasureUsersArtifact = require("../../build/Erasure_Users.json");

describe("Erasure_Users", function() {
  let deployer;
  const users = [];
  const userDatas = {};

  let userIndex = 0;
  const addNewUser = () => {
    const user = accounts[userIndex].signer.signingKey.address;

    const userData = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(userIndex.toString())
    );
    userDatas[userIndex] = userData;
    users.push(user);

    userIndex++;
    return { user, userData };
  };

  const removeUser = () => {
    const user = users.pop();
    delete userDatas[user];
    return user;
  };

  before(async () => {
    deployer = await createDeployer();
    this.ErasureUsers = await deployer.deploy(ErasureUsersArtifact);
  });

  describe("Erasure_Users.registerUser", () => {
    it("should register user", async () => {
      const { user, userData } = addNewUser();

      const txn = await this.ErasureUsers.from(user).registerUser(userData);
      await assert.emit(txn, "UserRegistered");
      await assert.emitWithArgs(txn, [user, userData]);

      const actualUserData = await this.ErasureUsers.getUserData(user);
      assert.equal(actualUserData, userData);
    });

    it("should revert when user is already registered", async () => {
      const user = accounts[userIndex - 1].signer.signingKey.address;
      await assert.revertWith(
        this.ErasureUsers.from(user).registerUser(Buffer.from("revert")),
        "user already exists"
      );
    });
  });

  describe("Erasure_Users.getUserCount", () => {
    it("should get user count correctly", async () => {
      const populateCount = 5;

      for (let i = 0; i < populateCount; i++) {
        const { user, userData } = addNewUser();
        await this.ErasureUsers.from(user).registerUser(userData);
      }

      const userCount = await this.ErasureUsers.getUserCount();
      assert.equal(userCount, users.length);
    });
  });

  describe("Erasure_Users.getUsers", () => {
    it("should get users correctly", async () => {
      const actualUsers = await this.ErasureUsers.getUsers();
      assert.deepEqual(actualUsers, users);
    });
  });

  describe("Erasure_Users.getPaginatedUsers", () => {
    it("should revert when startIndex >= endIndex", async () => {
      await assert.revertWith(
        this.ErasureUsers.getPaginatedUsers(3, 2),
        "startIndex must be less than endIndex"
      );
    });

    it("should revert when endIndex > instances.length", async () => {
      await assert.revertWith(
        this.ErasureUsers.getPaginatedUsers(users.length - 1, users.length + 1),
        "end index out of range"
      );
    });

    it("should get paginated users correctly", async () => {
      let startIndex = 0;
      let endIndex = 3;
      let actualUsers = await this.ErasureUsers.getPaginatedUsers(
        startIndex,
        endIndex
      );
      assert.deepEqual(actualUsers, users.slice(startIndex, endIndex)); // deepEqual because array comparison

      startIndex = 3;
      endIndex = 5;
      actualUsers = await this.ErasureUsers.getPaginatedUsers(
        startIndex,
        endIndex
      );
      assert.deepEqual(actualUsers, users.slice(startIndex, endIndex)); // deepEqual because array comparison
    });
  });

  describe("Erasure_Users.removeUser", () => {
    it("should revert when user does not exist", async () => {
      const unaddedUser = accounts[userIndex + 1]; //last used user is userIndex. use userIndex+1 to get unadded user
      await assert.revertWith(
        this.ErasureUsers.from(unaddedUser).removeUser(),
        "user does not exist"
      );
    });

    it("should remove user", async () => {
      const startCount = await this.ErasureUsers.getUserCount();
      const expectedCount = startCount - 1; // original user count -1 after removing a user

      const user = removeUser();
      const txn = await this.ErasureUsers.from(user).removeUser();
      await assert.emit(txn, "UserRemoved");
      await assert.emitWithArgs(txn, [user]);

      // ensure user data is deleted
      const actualUserData = await this.ErasureUsers.getUserData(user);
      assert.equal(actualUserData, "0x");

      // ensure user does not pop up in users
      const actualUsers = await this.ErasureUsers.getUsers();
      assert.equal(actualUsers.indexOf(user), -1); // -1 indicates not in array

      // ensure user count is updated
      const actualCount = await this.ErasureUsers.getUserCount();
      assert.equal(actualCount, expectedCount);
    });
  });
});
