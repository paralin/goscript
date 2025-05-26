// Generated file based on labeled_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let __gotoState = 0; // 0 = start, -1 = end

	__gotoLoop: while (__gotoState >= 0) {
		switch (__gotoState) {
			case 0: // main flow
				label1: for (let i = 0; i < 3; i++) {
					if (i == 1) {
						continue
					}
					console.log("continue test i:", i)
				}
				let x: number = 42
				console.log("x:", x)
				__gotoState = 2; // goto label2
				continue __gotoLoop
			case 2: // label2
				{
					let y: number = 100
					console.log("y:", y)
				}
				label3: for (let i = 0; i < 5; i++) {
					if (i == 3) {
						break
					}
					console.log("i:", i)
				}
				outer: for (let i = 0; i < 3; i++) {
					inner: for (let j = 0; j < 3; j++) {
						if (i == 1 && j == 1) {
							break
						}
						if (j == 1) {
							continue
						}
						console.log("nested:", i, j)
					}
				}
				console.log("test finished")
				__gotoState = -1; // end
				break;
		}
	}
}

