const ethers = require("ethers");
const SpawnArtifact = require("../../build/Spawn.json");

const hexlify = utf8str =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(utf8str));

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

  const joinedTypes = abiTypes.join(",");
  const initSignature = `${initializeFunctionName}(${joinedTypes})`;

  const initSelector = ethers.utils.hexDataSlice(
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(initSignature)),
    0,
    4
  );

  const initData =
    initSelector + abiEncoder.encode(abiTypes, abiValues).slice(2);

  const initCallData = abiEncoder.encode(
    ["address", "bytes"],
    [logicContractAddress, initData]
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
    initData,
    instanceAddress
  };
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
  createEip1167RuntimeCode
};
