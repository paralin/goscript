// Generated file based on value_type_copy_behavior.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

class MyStruct {
	public get MyInt(): number {
		return this._fields.MyInt.value
	}
	public set MyInt(value: number) {
		this._fields.MyInt.value = value
	}

	public get MyString(): string {
		return this._fields.MyString.value
	}
	public set MyString(value: string) {
		this._fields.MyString.value = value
	}

	public _fields: {
		MyInt: $.Box<number>;
		MyString: $.Box<string>;
	}

	constructor(init?: Partial<{MyInt?: number, MyString?: string}>) {
		this._fields = {
			MyInt: $.box(init?.MyInt ?? 0),
			MyString: $.box(init?.MyString ?? "")
		}
	}

	public clone(): MyStruct {
		const cloned = new MyStruct()
		cloned._fields = {
			MyInt: $.box(this._fields.MyInt.value),
			MyString: $.box(this._fields.MyString.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'MyStruct',
	  $.TypeKind.Struct,
	  new MyStruct(),
	  new Set([]),
	  MyStruct
	);
}

class NestedStruct {
	public get Value(): number {
		return this._fields.Value.value
	}
	public set Value(value: number) {
		this._fields.Value.value = value
	}

	public get InnerStruct(): MyStruct {
		return this._fields.InnerStruct.value
	}
	public set InnerStruct(value: MyStruct) {
		this._fields.InnerStruct.value = value
	}

	public _fields: {
		Value: $.Box<number>;
		InnerStruct: $.Box<MyStruct>;
	}

	constructor(init?: Partial<{InnerStruct?: MyStruct, Value?: number}>) {
		this._fields = {
			Value: $.box(init?.Value ?? 0),
			InnerStruct: $.box(init?.InnerStruct?.clone() ?? new MyStruct())
		}
	}

	public clone(): NestedStruct {
		const cloned = new NestedStruct()
		cloned._fields = {
			Value: $.box(this._fields.Value.value),
			InnerStruct: $.box(this._fields.InnerStruct.value?.clone() ?? null)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'NestedStruct',
	  $.TypeKind.Struct,
	  new NestedStruct(),
	  new Set([]),
	  NestedStruct
	);
}

export function main(): void {
	// Horizontal line for output clarity
	console.log("----------------------------------------------------------")
	console.log("VALUE TYPE COPY BEHAVIOR TEST")
	console.log("----------------------------------------------------------")

	// original is the starting struct instance.
	// We take its address later for pointerCopy, so it might be allocated on the heap (boxed).
	let original: $.Box<MyStruct> = $.box(new MyStruct({MyInt: 42, MyString: "original"}))

	// === Value-Type Copy Behavior ===
	// Assigning a struct (value type) creates independent copies.
	// valueCopy1 and valueCopy2 get their own copies of 'original's data.
	let valueCopy1 = original!.value.clone()
	let valueCopy2 = original!.value.clone()
	// pointerCopy holds the memory address of 'original'.
	let pointerCopy = original

	// Modifications to value copies do not affect the original or other copies.
	valueCopy1.MyString = "value copy 1"
	// Modify the original struct *after* the value copies were made.
	original!.value.MyString = "original modified"
	valueCopy2.MyString = "value copy 2"

	console.log("Value Copy Test:")
	// valueCopy1 was modified independently.
	console.log("  valueCopy1.MyString: " + valueCopy1.MyString) // Expected: "value copy 1"
	// original was modified after copies, showing its current state.
	console.log("  original.MyString: " + original!.value.MyString) // Expected: "original modified"
	// valueCopy2 was modified independently.
	console.log("  valueCopy2.MyString: " + valueCopy2.MyString) // Expected: "value copy 2"

	// === Pointer Behavior ===
	// Demonstrate how modifications via a pointer affect the original struct.
	console.log("\nPointer Behavior Test:")
	// Show the state of 'original' before modification via the pointer.
	console.log("  Before pointer modification - original.MyString: " + original!.value.MyString)

	// Modify the struct 'original' *through* the pointerCopy.
	pointerCopy!.value.MyString = "modified through pointer"
	pointerCopy!.value.MyInt = 100

	// Show the state of 'original' *after* modification via the pointer.
	// Both fields reflect the changes made through pointerCopy.
	console.log("  After pointer modification - original.MyString:", original!.value.MyString)
	console.log("  After pointer modification - original.MyInt:", original!.value.MyInt)

	// === Nested Struct Behavior ===
	// Demonstrate copy behavior with structs containing other structs.
	console.log("\nNested Struct Test:")
	let nestedOriginal = new NestedStruct({InnerStruct: new MyStruct({MyInt: 20, MyString: "inner original"}), Value: 10})

	// Create a value copy of the nested struct. This copies both the outer
	// struct's fields (Value) and the inner struct (InnerStruct) by value.
	let nestedCopy = nestedOriginal.clone()

	// Modify the copy's fields, including fields within the nested InnerStruct.
	nestedCopy.InnerStruct.MyString = "inner modified"
	nestedCopy.Value = 30

	// Show that modifications to nestedCopy did not affect nestedOriginal.
	console.log("  nestedCopy.Value: ", nestedCopy.Value) // Expected: 30
	console.log("  nestedOriginal.Value: ", nestedOriginal.Value) // Expected: 10
	console.log("  nestedCopy.InnerStruct.MyString: " + nestedCopy.InnerStruct.MyString) // Expected: "inner modified"
	console.log("  nestedOriginal.InnerStruct.MyString: " + nestedOriginal.InnerStruct.MyString) // Expected: "inner original"

	console.log("----------------------------------------------------------")
}

