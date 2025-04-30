// Generated file based on interface_multi_param_return.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MultiParamReturner {
	Process(data: number[], count: number, _p2: string): [boolean, goscript.Error];
}

// Define interface type information
const MultiParamReturner__typeInfo: goscript.InterfaceTypeInfo = {
  kind: goscript.GoTypeKind.Interface,
  name: 'MultiParamReturner',
  zero: null,
  methods: [{ name: 'Process', params: [{ type: { kind: goscript.GoTypeKind.Slice, name: '[]byte', zero: [], elem: goscript.BYTE_TYPE }, isVariadic: false }, { type: goscript.INT_TYPE, isVariadic: false }, { type: goscript.STRING_TYPE, isVariadic: false }], results: [{ type: goscript.BOOL_TYPE }, { type: goscript.ERROR_TYPE }] }]
};

class MyProcessor {

	public Process(data: number[], count: number, _p2: string): [boolean, goscript.Error] {
		const p = this
		if (count > 0 && goscript.len(data) > 0) {
			console.log("Processing successful")
			return [true, null]
		}
		console.log("Processing failed")
		return [false, null]
	}

	constructor(init?: Partial<MyProcessor>) { if (init) Object.assign(this, init as any); }
	public clone(): MyProcessor { return Object.assign(Object.create(MyProcessor.prototype) as MyProcessor, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyProcessor',
	  zero: new MyProcessor(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'Process', params: [{ type: { kind: goscript.GoTypeKind.Slice, name: '[]byte', zero: [], elem: goscript.BYTE_TYPE }, isVariadic: false }, { type: goscript.INT_TYPE, isVariadic: false }, { type: goscript.STRING_TYPE, isVariadic: false }], results: [{ type: goscript.BOOL_TYPE }, { type: goscript.ERROR_TYPE }] }],
	  ctor: MyProcessor
	};

}

export async function main(): Promise<void> {
	//nolint:staticcheck
	let processor: MultiParamReturner | null = null;
	processor = (goscript.isAssignable(new MyProcessor({}), MultiParamReturner__typeInfo) ? new MyProcessor({}) : null)

	let data = [1, 2, 3]
	let [success, ] = processor.Process(data, 5, "unused")

	if (success) {
		console.log("Main: Success reported")
	} else {
		console.log("Main: Failure reported")
	}
}

