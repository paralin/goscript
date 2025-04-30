// Generated file based on type_system.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

interface NumPrinter {
	PrintNum(): void;
	GetNum(): number;
}

// Register this interface with the runtime type system
const NumPrinter__typeInfo = goscript.registerType(
  'NumPrinter',
  goscript.GoTypeKind.Interface,
  null,
  [{ name: 'PrintNum', params: [], results: [] }, { name: 'GetNum', params: [], results: [{ type: goscript.getType('int')! }] }],
  undefined
);

class MyData {
	public num: number = 0;
	public label: string = "";

	// Implement NumPrinter interface with a value receiver method
	public PrintNum(): void {
		const d = this
		console.log("MyData num:", d.num, "Label:", d.label)
	}

	// Implement NumPrinter interface with a pointer receiver method
	public GetNum(): number {
		const d = this
		return this.num
	}

	constructor(init?: Partial<MyData>) { if (init) Object.assign(this, init as any); }
	public clone(): MyData { return Object.assign(Object.create(MyData.prototype) as MyData, this); }

	// Type information for runtime type system
	static __typeInfo = goscript.registerType(
	  'MyData',
	  goscript.GoTypeKind.Struct,
	  new MyData(),
	  [{ name: 'PrintNum', params: [], results: [] }],
	  MyData
	);

}

// Register pointer type
const MyData__ptrTypeInfo = goscript.registerType(
  '*MyData',
  goscript.GoTypeKind.Pointer,
  null,
  [{ name: 'PrintNum', params: [], results: [] }, { name: 'GetNum', params: [], results: [{ type: goscript.getType('int')! }] }],
  MyData.__typeInfo
);

export async function main(): Promise<void> {
	// Create struct pointer
	let dataPtr = goscript.createGoPtr(new MyData({num: 20, label: "B"}))

	// Assign pointer to interface
	// MyData does not fully implement NumPrinter (GetNum has pointer receiver)
	// *MyData implements NumPrinter (PrintNum is promoted, GetNum is defined)
	let np: NumPrinter | null = null;
	np = (goscript.isAssignable(dataPtr, goscript.getType('NumPrinter')!) ? dataPtr : null) // OK

	console.log("--- Interface Method Calls ---")
	np.PrintNum() // Call value receiver method via interface holding pointer
	let retrievedNum = np.GetNum() // Call pointer receiver method
	console.log("Retrieved num via interface:", retrievedNum)

	console.log("\n--- Type Assertions (Comma-Ok) ---")
	// Assert interface (holding *MyData) to *MyData
	let { value: mdPtr1, ok: ok1 } = goscript.typeAssert<goscript.Ptr<MyData>>(np, '*MyData')
	if (ok1) {
		console.log("np.(*MyData) OK:", ok1, "Num:", (mdPtr1)?.ref?.num)
	} else {
		console.log("np.(*MyData) FAILED:", ok1)
	}

	// Assert interface (holding *MyData) to NumPrinter (interface to itself)
	let { value: np2, ok: ok2 } = goscript.typeAssert<NumPrinter>(np, 'NumPrinter')
	if (ok2) {
		console.log("np.(NumPrinter) OK:", ok2, "Can call GetNum:", np2.GetNum())
	} else {
		console.log("np.(NumPrinter) FAILED:", ok2)
	}

	// Assert interface (holding *MyData) to MyData (INVALID: MyData doesn't implement NumPrinter)
	// _, okInvalid := np.(MyData)
	// println("np.(MyData) OK:", okInvalid) // This would be false

	// Assert nil interface to *MyData
	let nilNp: NumPrinter | null = null;
	let { ok: okNil } = goscript.typeAssert<goscript.Ptr<MyData>>(nilNp, '*MyData')
	console.log("nilNp.(*MyData) OK:", okNil) // Should be false

	console.log("\n--- Type Assertions (Panic Form) ---")
	// Assert interface (holding *MyData) to *MyData
	console.log("Asserting np.(*MyData)...")
	let mdPtr2 = goscript.typeAssert<goscript.Ptr<MyData>>(np, '*MyData').value // Should succeed
	console.log("Success! mdPtr2.num:", (mdPtr2)?.ref?.num)

	// Assert interface (holding *MyData) to NumPrinter
	console.log("Asserting np.(NumPrinter)...")
	let np3 = goscript.typeAssert<NumPrinter>(np, 'NumPrinter').value // Should succeed
	np3.PrintNum() // Call method on the result

	// Assert interface (holding *MyData) to MyData (INVALID - should panic if uncommented)
	// println("Asserting np.(MyData)... (should panic)")
	// _ = np.(MyData)
	// println("This should not be printed")

	// Assert nil interface to string (should panic if uncommented)
	// println("Asserting nilNp.(string)... (should panic)")
	// _ = nilNp.(string)
	// println("This should not be printed")

	console.log("\n--- Zero Values ---")
	let zd: MyData = new MyData()
	;
	let zpd: goscript.Ptr<MyData> = null;
	let znp: NumPrinter | null = null;
	console.log("Zero MyData num:", zd.num)
	console.log("Zero *MyData is nil:", zpd == null)
	console.log("Zero NumPrinter is nil:", znp == null)
}

