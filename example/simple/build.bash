#!/bin/bash
set -eo pipefail
set -x

pkgs=( "." )
for pkg in ${pkgs[@]}; do
    go run -v github.com/paralin/goscript/cmd/goscript \
         compile \
         --package $pkg
done

# Copy for reference
cp ./output/@goscript/example/main.gs.ts ./main.gs.ts