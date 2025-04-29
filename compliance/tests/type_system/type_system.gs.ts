// Generated file based on type_system.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface Printer {
	Print(): void;
	GetValue(): number;
}

// Register this interface with the runtime type system
const Printer__typeInfo = goscript.registerType(
  'Printer',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'Print', params: [], results: [] }, { name: 'GetValue', params: [], results: [{ type: goscript.getType('int')! }] }],
  undefined
);

class Data {
	public value: number = 0;
	public label: string = "";
	public tags: string[] = [];
	public lookup: Map<string, boolean> | null = null;

	// Implement Printer interface with a value receiver
	public Print(): void {
		const d = this
		console.log("Data value:", d.value, "Label:", d.label)
	}

	// Implement Printer interface with a pointer receiver
	public GetValue(): number {
		const d = this
		return (d).ref!.value
	}

	constructor(init?: Partial<Data>) { if (init) Object.assign(this, init as any); }
	public clone(): Data { return Object.assign(Object.create(Data.prototype) as Data, this); }


  // Type information for runtime type system
  static __typeInfo = goscript.registerType(
    'Data',
    goscript.GoTypeKind.Struct,
    new Data(),
    [{ name: 'Print', params: [], results: [] }, { name: 'GetValue', params: [], results: [{ type: goscript.getType('int')! }] }],
    Data
  );
}
// Register the pointer type *Data with the runtime type system
const Data__ptrTypeInfo = goscript.registerType(
  '*Data',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'Print', params: [], results: [] }, { name: 'GetValue', params: [], results: [{ type: goscript.getType('int')! }] }],
  Data.__typeInfo
);

type Processor = ((_p0: number) => number) | null;

export async function main(): Promise<void> {
	// Create struct value
	let d1 = new Data({value: 10, label: "A", tags: ["tag1"], lookup: new Map([["ok", true]])})

	// Create struct pointer
	let d2 = new goscript.GoPtr(new Data({value: 20, label: "B"}))

	// Assign value to interface
	let p1: Printer | null = null;
	// p1 = d1 // INVALID: Data does not implement Printer (GetValue has pointer receiver)

	// Assign pointer to interface
	let p2: Printer | null = null;
	// p2 = d1 // Fails: Data does not have GetValue() (pointer receiver)
	p2 = (goscript.isAssignable(d2, goscript.getType('Printer')!) ? d2 : null) // OK: *Data has both Print() (promoted) and GetValue()

	console.log("Testing pointer receiver assignment:")
	(p2 instanceof goscript.GoPtr ? p2.ref!.Print : p2.Print)() // Can call value receiver method via pointer
	let val = (p2 instanceof goscript.GoPtr ? p2.ref!.GetValue : p2.GetValue)() // Can call pointer receiver method
	console.log("Value from p2:", val)

	// Assert p1 (interface is nil) to Data (should fail)
	// data1, ok1 := p1.(Data) // IMPOSSIBLE: Data does not implement Printer
	// println("p1.(Data):", ok1) // Cannot access data1.value if ok1 is false
	console.log("Testing type assertions (comma-ok):")

	// Assert p1 (interface is nil) to *Data (should fail)
	let { ok: ok2 } = goscript.typeAssert<goscript.Ptr<Data>>(p1, '*Data')
	console.log("p1.(*Data):", ok2) // p1 is nil, so assertion fails

	// Assert p2 (holding *Data) to *Data
	let { value: dataPtr2, ok: ok3 } = goscript.typeAssert<goscript.Ptr<Data>>(p2, '*Data')
	console.log("p2.(*Data):", ok3, (dataPtr2).ref!.value)

	// Assert p2 (holding *Data) to Data (IMPOSSIBLE: Data does not implement Printer)
	// _, ok4 := p2.(Data)
	// println("p2.(Data):", ok4)

	// Assert p2 (holding *Data) to Printer (should succeed)
	let { ok: ok5 } = goscript.typeAssert<Printer>(p2, 'Printer')
	console.log("p2.(Printer):", ok5) // Use ok5

	console.log("Testing type assertions (panic form):")
	// This should succeed
	let data3 = goscript.typeAssert<Printer>(p2, 'Printer').value
	(data3 instanceof goscript.GoPtr ? data3.ref!.Print : data3.Print)()

	// This should succeed
	let data4 = goscript.typeAssert<goscript.Ptr<Data>>(p2, '*Data').value
	console.log("Value from data4:", (data4).ref!.value)

	// Test zero values implicitly
	let dZero: Data = new Data()
	;
	let pZero: goscript.Ptr<Data> = null;
	let iZero: Printer | null = null;
	let sZero: number[] = [];
	let mZero: Map<number, string> | null = null;
	let fnZero: Processor = null;

	// Cannot easily print zero values without fmt, but their declaration tests compiler handling
	console.log("Declared zero values (compiler check)")
	// Avoid printing nil pointers/interfaces directly with println if it causes issues
	if (dZero.value == 0) {
		console.log("dZero.value is zero")
	}
	if (pZero == null) {
		console.log("pZero is nil")
	}
	if (iZero == null) {
		console.log("iZero is nil")
	}
	if (sZero == null) {
		console.log("sZero is nil")
	}
	if (mZero == null) {
		console.log("mZero is nil")
	}

	// Test assertion that should panic (uncomment to test panic)
	// println("Testing panic assertion:")
	// _ = p1.(string) // Assert Data to string - should panic
	if (fnZero == null) {

		// Test assertion that should panic (uncomment to test panic)
		// println("Testing panic assertion:")
		// _ = p1.(string) // Assert Data to string - should panic
		console.log("fnZero is nil")

		// Test assertion that should panic (uncomment to test panic)
		// println("Testing panic assertion:")
		// _ = p1.(string) // Assert Data to string - should panic
	}

	// Test assertion that should panic (uncomment to test panic)
	// println("Testing panic assertion:")
	// _ = p1.(string) // Assert Data to string - should panic
}

