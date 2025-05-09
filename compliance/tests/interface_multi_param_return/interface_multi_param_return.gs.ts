// Generated file based on interface_multi_param_return.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

type MultiParamReturner = null | {
	Process(data: $.Slice<number>, count: number, _p2: string): [boolean, $.Error]
}

const MultiParamReturner__typeInfo = $.registerType(
  'MultiParamReturner',
  $.TypeKind.Interface,
  null, // Zero value for interface is null
  new Set(['Process']),
  undefined
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

	public Process(data: $.Slice<number>, count: number, _: string): [boolean, $.Error] {
		const p = this
		if (count > 0 && $.len(data) > 0) {
			$.println("Processing successful")
			return [true, null]
		}
		$.println("Processing failed")
		return [false, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyProcessor',
	  $.TypeKind.Struct,
	  new MyProcessor(),
	  new Set(['Process']),
	  MyProcessor
	);
}

export function main(): void {
	let processor: MultiParamReturner = null
	processor = new MyProcessor({})

	let data = $.arrayToSlice([1, 2, 3])
	let [success, ] = processor.Process(data, 5, "unused")

	if (success) {
		$.println("Main: Success reported")
	} else {
		$.println("Main: Failure reported")
	}
}

