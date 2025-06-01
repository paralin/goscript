// Generated file based on subpkg/types.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type MyInt = number;

export type MyUint = number;

export type MyFloat = number;

export type MyString = string;

export type MyBool = boolean;

export type Level1 = Level2;

export type Level2 = Level3;

export type Level3 = number;

export let IntValue: MyInt = 42

export let UintValue: MyUint = 0xFF

export let FloatValue: MyFloat = 3.14

export let StringValue: MyString = "hello"

export let BoolValue: MyBool = true

export let LevelValue: Level1 = 0x1000

// Helper function
export function GetCombinedFlags(): MyUint {
	return (255 | 0x10)
}

