#!/bin/bash

# kill ganache on exit
trap 'kill $(jobs -p)' EXIT

# this is awful, but we need to copy this file in order for etherlime to handle the accounts correctly
cp etherlime-setup.json node_modules/etherlime/cli-commands/ganache/setup.json
cp etherlime-setup.json node_modules/etherlime-config/ganacheSetup.json

yarn run ganache > ganache.log &

yarn run deploy ganache
