#!/bin/bash
set -eo pipefail
set -x

pkgs=( "os" "." )
for pkg in ${pkgs[@]}; do
    go run -v github.com/paralin/goscript/cmd/goscript \
         compile \
         --package $pkg
done
