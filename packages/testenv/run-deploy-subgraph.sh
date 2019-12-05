#!/bin/bash

cd subgraph/

yarn

yarn codegen
yarn create-local
yarn deploy-local
