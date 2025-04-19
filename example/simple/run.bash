#!/bin/bash
set -eo pipefail

if ! [ -d ./output/@go ]; then
    bash build.bash
fi

tsx --tsconfig ./tsconfig.json ./main.ts
