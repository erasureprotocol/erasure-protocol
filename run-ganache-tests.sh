#!/bin/bash

# kill ganache on exit
trap 'kill $(jobs -p)' EXIT

# this is awful, but we need to copy this file in order for etherlime to handle the accounts correctly
cp etherlime-setup.json node_modules/etherlime/cli-commands/ganache/setup.json
cp etherlime-setup.json node_modules/etherlime-config/ganacheSetup.json

yarn run ganache > ganache.log &

OUTPUT="$(yarn run test_etherlime)"

echo -e "$OUTPUT"

if echo OUTPUT | grep 'Error'; then
  exit 1
fi
