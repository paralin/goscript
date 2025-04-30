// Generated file based on interface_multi_param_return.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface MultiParamReturner {
	Process(data: number[], count: number, _p2: string): [boolean, goscript.Error];
}

// Register this interface with the runtime type system
const MultiParamReturner__typeInfo = goscript.registerType(
  'MultiParamReturner',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Process', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }, { type: goscript.getType('int')!, isVariadic: false }, { type: goscript.getType('string')!, isVariadic: false }], results: [{ type: goscript.getType('bool')! }, { type: goscript.getType('error')! }] }],
  undefined
);

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
	static __typeInfo = goscript.registerType(
	  'MyProcessor',
	  goscript.GoTypeKind.Struct,
	  new MyProcessor(),
	  [{ name: 'Process', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }, { type: goscript.getType('int')!, isVariadic: false }, { type: goscript.getType('string')!, isVariadic: false }], results: [{ type: goscript.getType('bool')! }, { type: goscript.getType('error')! }] }],
	  MyProcessor
	);

}

// Register pointer type
const MyProcessor__ptrTypeInfo = goscript.registerType(
  '*MyProcessor',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'Process', params: [{ type: goscript.getType('[]byte')!, isVariadic: false }, { type: goscript.getType('int')!, isVariadic: false }, { type: goscript.getType('string')!, isVariadic: false }], results: [{ type: goscript.getType('bool')! }, { type: goscript.getType('error')! }] }],
  MyProcessor.__typeInfo
);

export async function main(): Promise<void> {
	//nolint:staticcheck
	let processor: MultiParamReturner | null = null;
	processor = (goscript.isAssignable(new MyProcessor({}), goscript.getType('MultiParamReturner')!) ? new MyProcessor({}) : null)

	let data = [1, 2, 3]
	let [success, ] = (processor instanceof goscript.GoPtr ? processor.ref?.Process : processor.Process)(data, 5, "unused")

	if (success) {
		console.log("Main: Success reported")
	} else {
		console.log("Main: Failure reported")
	}
}

