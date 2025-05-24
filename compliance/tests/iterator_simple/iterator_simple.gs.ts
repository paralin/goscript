// Generated file based on iterator_simple.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

function simpleIterator(_yield: ((p0: number) => boolean) | null): void {
	for (let i = 0; i < 3; i++) {
		if (!_yield!(i)) {
			return 
		}
	}
}

function keyValueIterator(_yield: ((p0: number, p1: string) => boolean) | null): void {
	let values = $.arrayToSlice<string>(["a", "b", "c"])
	for (let i = 0; i < $.len(values); i++) {
		const v = values![i]
		{
			if (!_yield!(i, v)) {
				return 
			}
		}
	}
}

export async function main(): Promise<void> {
	console.log("Testing single value iterator:")
	;(() => {
		let shouldContinue = true
		simpleIterator((v) => {
			{
				console.log("value:", v)
			}
			return shouldContinue
		})
	})()
	console.log("Testing key-value iterator:")
	;(() => {
		let shouldContinue = true
		keyValueIterator((k, v) => {
			{
				console.log("key:", k, "value:", v)
			}
			return shouldContinue
		})
	})()
	console.log("test finished")
}

