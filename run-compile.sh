#!/bin/bash

OUTPUT="$(yarn etherlime compile --exportAbi=true --deleteCompiledFiles=true)"

echo -e "$OUTPUT"

if echo OUTPUT | grep 'Error'; then
  exit 1
fi

