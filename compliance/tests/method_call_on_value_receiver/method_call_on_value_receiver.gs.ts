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
  static __typeInfo = goscript.registerType(
    'MyStruct',
    goscript.GoTypeKind.Struct,
    new MyStruct(),
    [{ name: 'GetMyString', params: [], results: [{ type: goscript.getType('string')! }] }],
    MyStruct
  );
}
// Register the pointer type *MyStruct with the runtime type system
const MyStruct__ptrTypeInfo = goscript.registerType(
  '*MyStruct',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'GetMyString', params: [], results: [{ type: goscript.getType('string')! }] }],
  MyStruct.__typeInfo
);

export async function main(): Promise<void> {
	let ms = new MyStruct({MyInt: 1, MyString: "bar"})
	console.log("Method call on value: Expected: bar, Actual:", ms.GetMyString())
}

