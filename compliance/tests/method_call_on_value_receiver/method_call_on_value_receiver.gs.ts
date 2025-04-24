// Generated file based on method_call_on_value_receiver.go
// Updated when compliance tests are re-run, DO NOT EDIT!

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
}

export function main(): void {
	let ms = new MyStruct({ MyInt: 1, MyString: "bar" })
	console.log("Method call on value: Expected: bar, Actual:", ms.GetMyString())
}

