// Generated file based on interface_multi_param_return.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

interface MultiParamReturner {
	Process(data: number[], count: number, _p2: string): [boolean, goscript.Error];
}

// Register this interface with the runtime type system
const MultiParamReturner__typeInfo = goscript.registerType(
  'MultiParamReturner',
  goscript.TypeKind.Interface,
  null,
  new Set(['Process']),
  undefined
);

class MyProcessor {
	
	public Process(data: number[], count: number, _: string): [boolean, goscript.Error] {
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
	
	// Register this type with the runtime type system
	static __typeInfo = goscript.registerType(
	  'MyProcessor',
	  goscript.TypeKind.Struct,
	  new MyProcessor(),
	  new Set(['Process']),
	  MyProcessor
	);
}

export async function main(): Promise<void> {
	let processor: MultiParamReturner;
	processor = new MyProcessor({  })
	
	let data = [1, 2, 3]
	let [success, ] = processor.Process(data, 5, "unused")
	
	if (success) {
		console.log("Main: Success reported")
	} else {
		console.log("Main: Failure reported")
	}
}

