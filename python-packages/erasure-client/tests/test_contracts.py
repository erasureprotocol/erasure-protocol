import unittest

from erasure_lib.contracts import _make_contract

from web3 import Web3, WebsocketProvider


class TestContractHelpers(unittest.TestCase):
    def test_make_contract(self):

        web3 = Web3(WebsocketProvider(endpoint_uri="localhost:8545"))
        contract = _make_contract(
            web3, "0xA411eB36538a2Ae060A766221E43A94205460369", "Feed")
