#!/bin/bash

set -eu

yarn graph-codegen
yarn graph-create-local
yarn graph-deploy-local
