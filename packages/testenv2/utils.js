const ethers = require("ethers");

const hexlify = utf8str =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(utf8str));

const createIPFShash = string => {
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
  createIPFShash,
  abiEncodeWithSelector
};
