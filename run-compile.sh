#!/bin/bash

OUTPUT="$(yarn etherlime compile --solcVersion=0.5.11 --runs=200 --deleteCompiledFiles=true)"

echo -e "$OUTPUT"

if echo OUTPUT | grep 'Error'; then
  exit 1
fi

