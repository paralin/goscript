#!/bin/bash
set -eo pipefail

bash build.bash

tsx --tsconfig ./tsconfig.json ./main.ts