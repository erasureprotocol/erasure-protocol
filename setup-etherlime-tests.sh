#!/bin/bash

# this is awful, but we need to copy this file in order for etherlime to handle the accounts correctly
cp etherlime-setup.json node_modules/etherlime/cli-commands/ganache/setup.json
cp etherlime-setup.json node_modules/etherlime-config/ganacheSetup.json
