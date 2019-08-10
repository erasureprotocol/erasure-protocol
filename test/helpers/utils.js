const ethers = require("ethers");
const SpawnArtifact = require("../../build/Spawn.json");

const hexlify = utf8str =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(utf8str));

const createMultihashSha256 = string => {
  const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(string));
  const sha2_256 = ethers.utils.hexZeroPad("0x12", 8); // uint8
  const bits256 = ethers.utils.hexZeroPad(ethers.utils.hexlify(64), 8);

  const abiEncoder = new ethers.utils.AbiCoder();
  const multihash = abiEncoder.encode(
    ["uint8", "uint8", "bytes32"],
    [sha2_256, bits256, hash]
  );
  return multihash;
};

function createSelector(functionName, abiTypes) {
  const joinedTypes = abiTypes.join(",");
  const functionSignature = `${functionName}(${joinedTypes})`;

  const selector = ethers.utils.hexDataSlice(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)),
    0,
    4
  );
  return selector;
}

function createInstanceAddressWithInitData(
  factoryContractAddress,
  logicContractAddress,
  sender,
  selector,
  initData,
  nonce
) {
  const abiEncoder = new ethers.utils.AbiCoder();

  const callData = selector + initData.slice(2);

  const initCallData = abiEncoder.encode(
    ["address", "bytes"],
    [logicContractAddress, callData] // slice '0x' from initData
  );

  const initCodeHash = ethers.utils.solidityKeccak256(
    ["bytes", "bytes"],
    [SpawnArtifact.bytecode, initCallData]
  );

  const salt = ethers.utils.solidityKeccak256(
    ["address", "uint256"],
    [sender, nonce]
  );

  const create2hash = ethers.utils.solidityKeccak256(
    ["bytes1", "address", "bytes32", "bytes32"],
    ["0xff", factoryContractAddress, salt, initCodeHash]
  );

  let instanceAddress = ethers.utils.getAddress(
    "0x" + create2hash.slice(12).substring(14)
  );
  return {
    callData,
    instanceAddress
  };
}

// the long, manual way of re-creating the instance address
function createInstanceAddress(
  factoryContractAddress,
  logicContractAddress,
  sender,
  initializeFunctionName,
  abiTypes,
  abiValues,
  nonce
) {
  const abiEncoder = new ethers.utils.AbiCoder();

  const selector = createSelector(
    initializeFunctionName,
    abiTypes
  );

  const initData = abiEncoder.encode(abiTypes, abiValues);

  return createInstanceAddressWithInitData(
    factoryContractAddress,
    logicContractAddress,
    sender,
    selector,
    initData,
    nonce
  );
}

function createEip1167RuntimeCode(logicContractAddress) {
  return ethers.utils.solidityPack(
    ["bytes10", "address", "bytes15"],
    [
      "0x363d3d373d3d3d363d73",
      logicContractAddress,
      "0x5af43d82803e903d91602b57fd5bf3"
    ]
  );
}

module.exports = {
  hexlify,
  createInstanceAddress,
  createInstanceAddressWithInitData,
  createEip1167RuntimeCode,
  createSelector,
  createMultihashSha256
};
