// Generated file based on method_call_on_value_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

class MyStruct {
	public MyInt: number = 0;
	public MyString: string = "";

	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}

	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }

	// Type information for runtime type system
	static __typeInfo: goscript.StructTypeInfo = {
	  kind: goscript.GoTypeKind.Struct,
	  name: 'MyStruct',
	  zero: new MyStruct(),
	  fields: [], // Fields will be added in a future update
	  methods: [{ name: 'GetMyString', params: [], results: [{ type: goscript.STRING_TYPE }] }],
	  ctor: MyStruct
	};

}

export async function main(): Promise<void> {
	let ms = new MyStruct({MyInt: 1, MyString: "bar"})
	console.log("Method call on value: Expected: bar, Actual:", ms.GetMyString())
}

