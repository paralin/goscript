// Generated file based on interface_multi_param_return.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MultiParamReturner = null | {
	Process(data: $.Slice<number>, count: number, _p2: string): [boolean, $.GoError]
}

$.registerInterfaceType(
  'MultiParamReturner',
  null, // Zero value for interface is null
  new Set(['Process']),
);

class MyProcessor {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {
		}
	}

	public clone(): MyProcessor {
		const cloned = new MyProcessor()
		cloned._fields = {
		}
		return cloned
	}

	public Process(data: $.Slice<number>, count: number, _: string): [boolean, $.GoError] {
		const p = this
		if (count > 0 && $.len(data) > 0) {
			console.log("Processing successful")
			return [true, null]
		}
		console.log("Processing failed")
		return [false, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyProcessor',
	  new MyProcessor(),
	  new Set(["Process"]),
	  MyProcessor,
	  {}
	);
}

export function main(): void {
	let processor: MultiParamReturner = new MyProcessor({})

	let data = $.arrayToSlice<number>([1, 2, 3])
	let [success, ] = processor.Process(data, 5, "unused")

	if (success) {
		console.log("Main: Success reported")
	} else {
		console.log("Main: Failure reported")
	}

	// test case: re-use success variable, ignore second variable
	[success, ] = processor.Process(data, 5, "unused")
	if (success) {
		console.log("Main: Success reported")
	} else {
		console.log("Main: Failure reported")
	}
}

