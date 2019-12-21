"""
Feeds wrapper
"""
import json
import base58

from .contracts import _make_contract


class Feed:
    """
    Wrapper class for Erasure Feed contract
    """
    def __init__(self, web3, account, address):
        self.web3 = web3
        self.account = account

        self.contract = _make_contract(self.web3, address, "Feed")

    def create_post(self, multihash, metadata):
        """
        Create an erasure post
        """
        built_tx = self.contract.functions.createPostExplicit(
            '0x0000000000000000000000000000000000000000',
            base58.b58decode(multihash),
            json.dumps(metadata).encode(), b'').buildTransaction(
                {
                    'from': self.account.address,
                    'chainId': self.web3.eth.chainId,
                    'gasPrice': self.web3.Eth.generateGasPrice(),
                    'nonce': self.account.get_and_increment_nonce(),
                }, )

        # check that the transaction is valid
        self.web3.Eth.estimateGas(built_tx)

        signed_tx = self.account.signTransaction(built_tx)
        sent_tx = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)

        return sent_tx.hex()

    def get_creator(self):
        """
        Get creator of the feed
        """
        return self.contract.functions.getCreator().call()
