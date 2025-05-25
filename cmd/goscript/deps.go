package main

// This file has _ imports to ensure we include these in the go module.

import (
	// _ ensure we include the gs package
	_ "github.com/aperturerobotics/goscript"
	// _ ensure we include the gs metadata packages
	_ "github.com/aperturerobotics/goscript/gs/sync"
	_ "github.com/aperturerobotics/goscript/gs/unicode"
)
