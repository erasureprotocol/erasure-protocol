"""
Contract helpers
"""
import json
from os import path


def _get_artifact_dir():
    return path.dirname(__file__)


def _make_contract(web3, address, contract_name):
    with open(
            path.join(_get_artifact_dir(), "artifacts",
                      contract_name + ".json")) as json_file:
        abi = json.load(json_file)["abi"]

    check_sum_address = web3.toChecksumAddress(address)
    return web3.eth.contract(address=check_sum_address, abi=abi)
