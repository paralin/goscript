// Generated file based on named_return_method.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class content extends $.GoStruct<{bytes: $.Bytes}> {

	constructor(init?: Partial<{bytes?: $.Bytes}>) {
		super({
			bytes: { type: Object, default: new Uint8Array(0) }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public ReadAt(b: $.Bytes, off: number): [number, $.GoError] {
		const c = this
		let n: number = 0
		let err: $.GoError = null
		if (off < 0 || off >= ($.len(c.bytes) as number)) {
			err = null // Simulate an error scenario
			return [n, err]
		}
		let l = ($.len(b) as number)
		if (off + l > ($.len(c.bytes) as number)) {
			l = ($.len(c.bytes) as number) - off
		}
		let btr = $.goSlice(c.bytes, off, off + l)
		n = $.copy(b, btr)
		return [n, err]
	}

	public ProcessData(input: number): [number, string, boolean] {
		let result: number = 0
		let status: string = ""
		let valid: boolean = false
		result = input * 2
		if (input > 10) {
			status = "high"
			valid = true
		} else if (input > 0) {
			status = "low"
			valid = true
		} else {
			// status and valid will be zero values
			status = "invalid"
		}
		return [result, status, valid]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'content',
	  new content(),
	  [{ name: "ReadAt", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ProcessData", args: [{ name: "input", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  content,
	  {"bytes": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export async function main(): Promise<void> {
	let c = new content({bytes: $.stringToBytes("Hello, World!")})

	// Test ReadAt method
	let buf = new Uint8Array(5)
	let [n1, err1] = c.ReadAt(buf, 0)
	console.log(n1) // Expected: 5

	// Expected: nil
	if (err1 == null) {
		console.log("nil") // Expected: nil
	} else {
		console.log("error")
	}
	console.log($.bytesToString(buf)) // Expected: Hello

	// Test ReadAt with different offset
	let buf2 = new Uint8Array(6)
	let [n2, err2] = c.ReadAt(buf2, 7)
	console.log(n2) // Expected: 6

	// Expected: nil
	if (err2 == null) {
		console.log("nil") // Expected: nil
	} else {
		console.log("error")
	}
	console.log($.bytesToString(buf2)) // Expected: World!

	// Test ProcessData method
	let [r1, s1, v1] = c.ProcessData(15)
	console.log(r1) // Expected: 30
	console.log(s1) // Expected: high
	console.log(v1) // Expected: true

	let [r2, s2, v2] = c.ProcessData(5)
	console.log(r2) // Expected: 10
	console.log(s2) // Expected: low
	console.log(v2) // Expected: true

	let [r3, s3, v3] = c.ProcessData(-1)
	console.log(r3) // Expected: -2
	console.log(s3) // Expected: invalid
	console.log(v3) // Expected: false
}

