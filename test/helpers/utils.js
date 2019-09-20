const ethers = require("ethers");
const SpawnArtifact = require("../../build/Spawn.json");

const hexlify = utf8str =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(utf8str));

const createPaddedMultihashSha256 = string => {
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

const createMultihashSha256 = string => {
  const hash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(string));
  const sha2_256 = "0x12"; // uint8
  const bits256 = ethers.utils.hexlify(32);
  const multihash = sha2_256 + bits256.substr(2) + hash.substr(2);

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

function createInstanceAddressWithCallData(
  factoryContractAddress,
  logicContractAddress,
  sender,
  callData,
  nonce,
  salt
) {
  const abiEncoder = new ethers.utils.AbiCoder();

  const initCallData = abiEncoder.encode(
    ["address", "bytes"],
    [logicContractAddress, callData]
  );

  const initCodeHash = ethers.utils.solidityKeccak256(
    ["bytes", "bytes"],
    [SpawnArtifact.bytecode, initCallData]
  );

  if (!salt) {
    salt = ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [sender, nonce]
    );
  }

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
  nonce,
  salt
) {
  const callData = abiEncodeWithSelector(initializeFunctionName, abiTypes, abiValues);
  return createInstanceAddressWithCallData(
    factoryContractAddress,
    logicContractAddress,
    sender,
    callData,
    nonce,
    salt
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

const getLatestContractAdressFrom = async (provider, address) => {
  const nonce = await deployer.provider.getTransactionCount(address);
  const contractAddress = ethers.utils.getContractAddress({
    from: address,
    nonce: nonce - 1
  });
  return contractAddress;
};

/**
 * This function reflects the usage of abi.encodeWithSelector in Solidity.
 * It prepends the selector to the ABI-encoded values.
 *
 * @param {string} functionName
 * @param {Array<string>} abiTypes
 * @param {Array<any>} abiValues
 */
function abiEncodeWithSelector(functionName, abiTypes, abiValues) {
  const abiEncoder = new ethers.utils.AbiCoder();
  const initData = abiEncoder.encode(abiTypes, abiValues);
  const selector = createSelector(
    functionName,
    abiTypes
  );
  const encoded = selector + initData.slice(2);
  return encoded;
}

module.exports = {
  hexlify,
  createInstanceAddress,
  createInstanceAddressWithCallData,
  createEip1167RuntimeCode,
  createSelector,
  createMultihashSha256,
  getLatestContractAdressFrom,
  abiEncodeWithSelector,
};
