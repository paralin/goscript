// Generated file based on package_import_reflect.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as reflect from "@goscript/reflect/index.js"

export class Person {
	public get Name(): string {
		return this._fields.Name.value
	}
	public set Name(value: string) {
		this._fields.Name.value = value
	}

	public get Age(): number {
		return this._fields.Age.value
	}
	public set Age(value: number) {
		this._fields.Age.value = value
	}

	public _fields: {
		Name: $.VarRef<string>;
		Age: $.VarRef<number>;
	}

	constructor(init?: Partial<{Age?: number, Name?: string}>) {
		this._fields = {
			Name: $.varRef(init?.Name ?? // DEBUG: Field Name has type string (*types.Basic)
			// DEBUG: Using default zero value
			""),
			Age: $.varRef(init?.Age ?? // DEBUG: Field Age has type int (*types.Basic)
			// DEBUG: Using default zero value
			0)
		}
	}

	public clone(): Person {
		const cloned = new Person()
		cloned._fields = {
			Name: $.varRef(this._fields.Name.value),
			Age: $.varRef(this._fields.Age.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Person',
	  new Person(),
	  [],
	  Person,
	  {"Name": { kind: $.TypeKind.Basic, name: "string" }, "Age": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export type Stringer = null | {
	String(): string
}

$.registerInterfaceType(
  'Stringer',
  null, // Zero value for interface is null
  [{ name: "String", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }]
);

export async function main(): Promise<void> {
	// Test basic reflect functions
	let x = 42
	let v = reflect.ValueOf(x).clone()
	console.log("Type:", reflect.TypeOf(x)!.String())
	console.log("Value:", v.Int())
	console.log("Kind:", reflect.Kind_String(v.Kind()))

	// Test with string
	let s = "hello"
	let sv = reflect.ValueOf(s).clone()
	console.log("String type:", reflect.TypeOf(s)!.String())
	console.log("String value:", sv.String())
	console.log("String kind:", reflect.Kind_String(sv.Kind()))

	// Test with slice
	let slice = $.arrayToSlice<number>([1, 2, 3])
	let sliceV = reflect.ValueOf(slice).clone()
	console.log("Slice type:", reflect.TypeOf(slice)!.String())
	console.log("Slice len:", sliceV.Len())
	console.log("Slice kind:", reflect.Kind_String(sliceV.Kind()))

	// Test DeepEqual
	let a = $.arrayToSlice<number>([1, 2, 3])
	let b = $.arrayToSlice<number>([1, 2, 3])
	let c = $.arrayToSlice<number>([1, 2, 4])
	console.log("DeepEqual a==b:", reflect.DeepEqual(a, b))
	console.log("DeepEqual a==c:", reflect.DeepEqual(a, c))

	// Test Zero value
	let zeroInt = reflect.Zero(reflect.TypeOf(42)).clone()
	console.log("Zero int:", zeroInt.Int())

	// Test type construction functions
	let intType = reflect.TypeOf(0)
	let sliceType = reflect.SliceOf(intType)
	console.log("SliceOf int:", sliceType!.String())
	console.log("SliceOf kind:", reflect.Kind_String(sliceType!.Kind()))

	let arrayType = reflect.ArrayOf(5, intType)
	console.log("ArrayOf 5 int:", arrayType!.String())
	console.log("ArrayOf kind:", reflect.Kind_String(arrayType!.Kind()))

	let ptrType = reflect.PointerTo(intType)
	console.log("PointerTo int:", ptrType!.String())
	console.log("PointerTo kind:", reflect.Kind_String(ptrType!.Kind()))

	// Test PtrTo (alias for PointerTo)
	let ptrType2 = reflect.PtrTo(intType)
	console.log("PtrTo int:", ptrType2!.String())

	// Test New and Indirect
	let newVal = reflect.New(intType).clone()
	console.log("New int type:", newVal.Type()!.String())
	let indirectVal = reflect.Indirect(newVal).clone()
	console.log("Indirect type:", indirectVal.Type()!.String())

	// Test Zero values for different types
	let zeroString = reflect.Zero(reflect.TypeOf("")).clone()
	console.log("Zero string:", zeroString.String())

	let zeroBool = reflect.Zero(reflect.TypeOf(true)).clone()
	console.log("Zero bool:", zeroBool.String()) // Should show the type since it's not a string

	// Test Swapper function
	let testSlice = $.arrayToSlice<number>([1, 2, 3, 4, 5])
	let swapper = reflect.Swapper(testSlice)
	console.log("Before swap:", testSlice![0], testSlice![4])
	swapper!(0, 4)
	console.log("After swap:", testSlice![0], testSlice![4])

	// Test Copy function
	let src = $.arrayToSlice<number>([10, 20, 30])
	let dst = $.makeSlice<number>(2, undefined, 'number')
	let srcVal = reflect.ValueOf(src).clone()
	let dstVal = reflect.ValueOf(dst).clone()
	let copied = reflect.Copy(dstVal, srcVal)
	console.log("Copied elements:", copied)
	console.log("Dst after copy:", dst![0], dst![1])

	// Test struct reflection
	let person = new Person({Age: 30, Name: "Alice"})
	let personType = reflect.TypeOf(person)
	console.log("Struct type:", personType!.String())
	console.log("Struct kind:", reflect.Kind_String(personType!.Kind()))

	let personVal = reflect.ValueOf(person).clone()
	console.log("Struct value type:", personVal.Type()!.String())

	// Test with different kinds
	let f: number = 3.14
	let fVal = reflect.ValueOf(f).clone()
	console.log("Float kind:", reflect.Kind_String(fVal.Kind()))

	let boolVal: boolean = true
	let bVal = reflect.ValueOf(boolVal).clone()
	console.log("Bool kind:", reflect.Kind_String(bVal.Kind()))

	// Test type equality
	let intType1 = reflect.TypeOf(1)
	let intType2 = reflect.TypeOf(2)
	console.log("Same int types:", intType1!.String() == intType2!.String())

	let stringType = reflect.TypeOf("test")
	console.log("Different types:", intType1!.String() == stringType!.String())

	// Test map type construction
	let mapType = reflect.MapOf(reflect.TypeOf(""), reflect.TypeOf(0))
	console.log("MapOf string->int:", mapType!.String())
	console.log("MapOf kind:", reflect.Kind_String(mapType!.Kind()))

	// Test channel direction constants
	console.log("Chan kinds available")

	// Test pointer operations
	// Note: Pointer-to-pointer reflection has a compiler limitation
	// var ptr *int = &x
	// ptrVal := reflect.ValueOf(&ptr)
	// println("Pointer type:", ptrVal.Type().String())
	// println("Pointer kind:", ptrVal.Kind().String())

	// Test interface type
	let iface: null | any = "hello"
	let ifaceVal = reflect.ValueOf(iface).clone()
	console.log("Interface value type:", ifaceVal.Type()!.String())
	console.log("Interface kind:", reflect.Kind_String(ifaceVal.Kind()))

	// Test function type
	let fn = (() => {
		const fn = (): string => {
			return ""
		}
		fn.__typeInfo = {
			kind: $.TypeKind.Function,
			params: ['int'],
			results: ['string'],
		}
		return fn
	})()
	let fnVal = reflect.ValueOf(fn).clone()
	console.log("Function type:", fnVal.Type()!.String())
	console.log("Function kind:", reflect.Kind_String(fnVal.Kind()))

	// Test more complex types
	let complexSlice = $.arrayToSlice<$.Slice<number>>([[ 1, 2 ], [ 3, 4 ]], 2)
	let complexVal = reflect.ValueOf(complexSlice).clone()
	console.log("Complex slice type:", complexVal.Type()!.String())
	console.log("Complex slice kind:", reflect.Kind_String(complexVal.Kind()))
	console.log("Complex slice len:", complexVal.Len())

	// Test type methods
	console.log("Type size methods:")
	console.log("Int size:", reflect.TypeOf(0)!.Size())
	console.log("String size:", reflect.TypeOf("")!.Size())
	console.log("Slice size:", reflect.TypeOf($.arrayToSlice<number>([]))!.Size())

	// Test enhanced API surface - functions to implement
	console.log("Enhanced API tests:")

	// Test MakeSlice
	let sliceTypeInt = reflect.SliceOf(reflect.TypeOf(0))
	let newSlice = reflect.MakeSlice(sliceTypeInt, 3, 5).clone()
	console.log("MakeSlice len:", newSlice.Len())
	console.log("MakeSlice type:", newSlice.Type()!.String())

	// Test MakeMap
	let mapTypeStr = reflect.MapOf(reflect.TypeOf(""), reflect.TypeOf(0))
	let newMap = reflect.MakeMap(mapTypeStr).clone()
	console.log("MakeMap type:", newMap.Type()!.String())

	// Test Append
	let originalSlice = reflect.ValueOf($.arrayToSlice<number>([1, 2])).clone()
	let appendedSlice = reflect.Append(originalSlice, reflect.ValueOf(3)).clone()
	console.log("Append result len:", appendedSlice.Len())

	// Test channel types
	let chanType = reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0))
	console.log("ChanOf type:", chanType!.String())
	console.log("ChanOf kind:", reflect.Kind_String(chanType!.Kind()))

	// Test MakeChan
	let newChan = reflect.MakeChan(chanType, 0).clone()
	console.log("MakeChan type:", newChan.Type()!.String())

	// Test different channel directions
	let sendOnlyChan = reflect.ChanOf(reflect.SendDir, reflect.TypeOf(""))
	console.log("SendOnly chan type:", sendOnlyChan!.String())

	let recvOnlyChan = reflect.ChanOf(reflect.RecvDir, reflect.TypeOf(true))
	console.log("RecvOnly chan type:", recvOnlyChan!.String())

	// Test channels with different element types
	let stringChanType = reflect.ChanOf(reflect.BothDir, reflect.TypeOf(""))
	let stringChan = reflect.MakeChan(stringChanType, 5).clone()
	console.log("String chan type:", stringChan.Type()!.String())
	console.log("String chan elem type:", stringChan.Type()!.Elem()!.String())

	// Test buffered vs unbuffered channels
	let unbufferedChan = reflect.MakeChan(chanType, 0).clone()
	let bufferedChan = reflect.MakeChan(chanType, 10).clone()
	console.log("Unbuffered chan type:", unbufferedChan.Type()!.String())
	console.log("Buffered chan type:", bufferedChan.Type()!.String())

	// Test channel reflection properties
	console.log("Chan elem type:", chanType!.Elem()!.String())
	console.log("Chan elem kind:", reflect.Kind_String(chanType!.Elem()!.Kind()))
	console.log("Chan size:", chanType!.Size())

	// Test Select functionality
	let intChan = reflect.MakeChan(reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0)), 1).clone()
	let strChan = reflect.MakeChan(reflect.ChanOf(reflect.BothDir, reflect.TypeOf("")), 1).clone()

	// Send values to only the string channel to make select deterministic
	strChan.Send(reflect.ValueOf("hello"))

	let cases = $.arrayToSlice<reflect.SelectCase>([{Chan: intChan, Dir: reflect.SelectRecv}, {Chan: strChan, Dir: reflect.SelectRecv}, {Dir: reflect.SelectDefault}])
	let [chosen, recv, recvOK] = reflect.Select(cases)
	console.log("Select chosen:", chosen, "recvOK:", recvOK)

	// Print the actual received value
	if (recv.IsValid()) {
		console.log("Select recv type:", recv.Type()!.String())
		// Print the actual received value
		if (chosen == 0) {
			console.log("Select recv value:", recv.Int())
		}
		 else if (chosen == 1) {
			console.log("Select recv value:", recv.String())
		}
	}
	 else {
		console.log("Select recv type: invalid")
	}
}

