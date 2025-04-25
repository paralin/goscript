// Generated file based on interface_to_interface_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

interface MyInterface 
{
	Method1(): number;
}

class MyStruct {
	public Value: number = 0;
	
	public Method1(): number {
		const m = this
		return m.Value
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

interface MyOtherInterface 
{
	Method1(): number;
}

export function main(): void {
	let i: MyInterface;
	let s = new MyStruct({ Value: 10 })
	i = s.clone()
	
	let ok: boolean = (i as any) satisfies MyOtherInterface
	let assertedValue: MyOtherInterface | null = ok ? (i as MyOtherInterface) : null
	if (ok) {
		console.log("Type assertion successful")
	} else {
		console.log("Type assertion failed")
	}
}

