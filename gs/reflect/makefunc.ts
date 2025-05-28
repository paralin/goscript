import { Type, Value, uintptr, bitVector, funcType, rtype, flag } from "./reflect.js";
import { methodReceiver } from "./value.js";

import * as $ from "@goscript/builtin/builtin.js";
import { funcLayout } from "./type.js";
import * as abi from "@goscript/internal/abi/index.js";
import * as unsafe from "@goscript/unsafe/index.js"

class makeFuncImpl {
	public get ftyp(): { Type?: any; InCount?: number; OutCount?: number } | null {
		return this._fields.ftyp.value
	}
	public set ftyp(value: { Type?: any; InCount?: number; OutCount?: number } | null) {
		this._fields.ftyp.value = value
	}

	public get fn(): ((p0: $.Slice<Value>) => $.Slice<Value>) | null {
		return this._fields.fn.value
	}
	public set fn(value: ((p0: $.Slice<Value>) => $.Slice<Value>) | null) {
		this._fields.fn.value = value
	}

	public get makeFuncCtxt(): makeFuncCtxt {
		return this._fields.makeFuncCtxt.value
	}
	public set makeFuncCtxt(value: makeFuncCtxt) {
		this._fields.makeFuncCtxt.value = value
	}

	public _fields: {
		makeFuncCtxt: $.VarRef<makeFuncCtxt>;
		ftyp: $.VarRef<{ Type?: any; InCount?: number; OutCount?: number } | null>;
		fn: $.VarRef<((p0: $.Slice<Value>) => $.Slice<Value>) | null>;
	}

	constructor(init?: Partial<{fn?: ((p0: $.Slice<Value>) => $.Slice<Value>) | null, ftyp?: { Type?: any; InCount?: number; OutCount?: number } | null, makeFuncCtxt?: Partial<ConstructorParameters<typeof makeFuncCtxt>[0]>}>) {
		this._fields = {
			makeFuncCtxt: $.varRef(new makeFuncCtxt(init?.makeFuncCtxt)),
			ftyp: $.varRef(init?.ftyp ?? null),
			fn: $.varRef(init?.fn ?? null)
		}
	}

	public clone(): makeFuncImpl {
		const cloned = new makeFuncImpl()
		cloned._fields = {
			makeFuncCtxt: $.varRef(this._fields.makeFuncCtxt.value.clone()),
			ftyp: $.varRef(this._fields.ftyp.value),
			fn: $.varRef(this._fields.fn.value)
		}
		return cloned
	}

	public get stack(): bitVector | null {
		return this.makeFuncCtxt.stack
	}
	public set stack(value: bitVector | null) {
		this.makeFuncCtxt.stack = value
	}

	public get argLen(): uintptr {
		return this.makeFuncCtxt.argLen
	}
	public set argLen(value: uintptr) {
		this.makeFuncCtxt.argLen = value
	}

	public get regPtrs(): abi.IntArgRegBitmap {
		return this.makeFuncCtxt.regPtrs
	}
	public set regPtrs(value: abi.IntArgRegBitmap) {
		this.makeFuncCtxt.regPtrs = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'makeFuncImpl',
	  new makeFuncImpl(),
	  [],
	  makeFuncImpl,
	  {"makeFuncCtxt": "makeFuncCtxt", "ftyp": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Struct, fields: {"Type": "Type", "InCount": { kind: $.TypeKind.Basic, name: "number" }, "OutCount": { kind: $.TypeKind.Basic, name: "number" }}, methods: [] } }, "fn": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Slice, elemType: "Value" }], results: [{ kind: $.TypeKind.Slice, elemType: "Value" }] }}
	);
}

// MakeFunc returns a new function of the given [Type]
// that wraps the function fn. When called, that new function
// does the following:
//
//   - converts its arguments to a slice of Values.
//   - runs results := fn(args).
//   - returns the results as a slice of Values, one per formal result.
//
// The implementation fn can assume that the argument [Value] slice
// has the number and type of arguments given by typ.
// If typ describes a variadic function, the final Value is itself
// a slice representing the variadic arguments, as in the
// body of a variadic function. The result Value slice returned by fn
// must have the number and type of results given by typ.
//
// The [Value.Call] method allows the caller to invoke a typed function
// in terms of Values; in contrast, MakeFunc allows the caller to implement
// a typed function in terms of Values.
//
// The Examples section of the documentation includes an illustration
// of how to use MakeFunc to build a swap function for different types.
export function MakeFunc(typ: Type, fn: ((args: $.Slice<Value>) => $.Slice<Value>) | null): Value {
	if (typ!.Kind().valueOf() != 19) {
		$.panic("reflect: MakeFunc of non-func type")
	}

	let t = typ!.common!()
	let ftyp = new funcType(typ!.Kind())

	let code = abi.FuncPCABI0(makeFuncStub)

	// makeFuncImpl contains a stack map for use by the runtime
	let [, , abid] = funcLayout(ftyp, null)

	let impl = new makeFuncImpl({fn: fn, ftyp: {Type: typ, InCount: 0, OutCount: 0}, makeFuncCtxt: {fn: code, stack: abid.stackPtrs, argLen: abid.stackCallArgsSize, regPtrs: abid.inRegPtrs}})

	return new Value({})
}

// makeFuncStub is an assembly function that is the code half of
// the function returned from MakeFunc. It expects a *callReflectFunc
// as its context register, and its job is to invoke callReflect(ctxt, frame)
// where ctxt is the context register and frame is a pointer to the first
// word in the passed-in argument frame.
export function makeFuncStub(): void {}

class methodValue {
	public get method(): number {
		return this._fields.method.value
	}
	public set method(value: number) {
		this._fields.method.value = value
	}

	public get rcvr(): Value {
		return this._fields.rcvr.value
	}
	public set rcvr(value: Value) {
		this._fields.rcvr.value = value
	}

	public get makeFuncCtxt(): makeFuncCtxt {
		return this._fields.makeFuncCtxt.value
	}
	public set makeFuncCtxt(value: makeFuncCtxt) {
		this._fields.makeFuncCtxt.value = value
	}

	public _fields: {
		makeFuncCtxt: $.VarRef<makeFuncCtxt>;
		method: $.VarRef<number>;
		rcvr: $.VarRef<Value>;
	}

	constructor(init?: Partial<{makeFuncCtxt?: Partial<ConstructorParameters<typeof makeFuncCtxt>[0]>, method?: number, rcvr?: Value}>) {
		this._fields = {
			makeFuncCtxt: $.varRef(new makeFuncCtxt(init?.makeFuncCtxt)),
			method: $.varRef(init?.method ?? 0),
			rcvr: $.varRef(init?.rcvr?.clone() ?? new Value())
		}
	}

	public clone(): methodValue {
		const cloned = new methodValue()
		cloned._fields = {
			makeFuncCtxt: $.varRef(this._fields.makeFuncCtxt.value.clone()),
			method: $.varRef(this._fields.method.value),
			rcvr: $.varRef(this._fields.rcvr.value?.clone() ?? null)
		}
		return cloned
	}

	public get fn(): uintptr {
		return this.makeFuncCtxt.fn
	}
	public set fn(value: uintptr) {
		this.makeFuncCtxt.fn = value
	}

	public get stack(): bitVector | null {
		return this.makeFuncCtxt.stack
	}
	public set stack(value: bitVector | null) {
		this.makeFuncCtxt.stack = value
	}

	public get argLen(): uintptr {
		return this.makeFuncCtxt.argLen
	}
	public set argLen(value: uintptr) {
		this.makeFuncCtxt.argLen = value
	}

	public get regPtrs(): abi.IntArgRegBitmap {
		return this.makeFuncCtxt.regPtrs
	}
	public set regPtrs(value: abi.IntArgRegBitmap) {
		this.makeFuncCtxt.regPtrs = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'methodValue',
	  new methodValue(),
	  [],
	  methodValue,
	  {"makeFuncCtxt": "makeFuncCtxt", "method": { kind: $.TypeKind.Basic, name: "number" }, "rcvr": "Value"}
	);
}

// makeMethodValue converts v from the rcvr+method index representation
// of a method value to an actual method func value, which is
// basically the receiver value with a special bit set, into a true
// func value - a value holding an actual func. The output is
// semantically equivalent to the input as far as the user of package
// reflect can tell, but the true func representation can be handled
// by code like Convert and Interface and Assign.
export function makeMethodValue(op: string, v: Value): Value {
	if ((v.flag & 512) == 0) {
		$.panic("reflect: internal error: invalid use of makeMethodValue")
	}

	// Ignoring the flagMethod bit, v describes the receiver, not the method type.
	let fl = (v.flag & (((96 | 256) | 128)))
	fl |= flag.from(v.typ()!.Kind()).valueOf()
	let rcvr = new Value({})

	// v.Type returns the actual type of the method value.
	let ftyp = new funcType(v.typ()!.Kind())

	let code = methodValueCallCodePtr()

	// methodValue contains a stack map for use by the runtime
	let [, , abid] = funcLayout(ftyp, null)
	let fv = new methodValue({method: ($.int(v.flag) >> 10), rcvr: rcvr, makeFuncCtxt: {fn: code, stack: abid.stackPtrs, argLen: abid.stackCallArgsSize, regPtrs: abid.inRegPtrs}})

	// Cause panic if method is not appropriate.
	// The panic would still happen during the call if we omit this,
	// but we want Interface() and other operations to fail early.
	methodReceiver(op, fv!.rcvr, fv!.method)

	return new Value({})
}

export function methodValueCallCodePtr(): uintptr {
	return abi.FuncPCABI0(methodValueCall)
}

// methodValueCall is an assembly function that is the code half of
// the function returned from makeMethodValue. It expects a *methodValue
// as its context register, and its job is to invoke callMethod(ctxt, frame)
// where ctxt is the context register and frame is a pointer to the first
// word in the passed-in argument frame.
export function methodValueCall(): void {}

class makeFuncCtxt {
	public get fn(): uintptr {
		return this._fields.fn.value
	}
	public set fn(value: uintptr) {
		this._fields.fn.value = value
	}

	// ptrmap for both stack args and results
	public get stack(): bitVector | null {
		return this._fields.stack.value
	}
	public set stack(value: bitVector | null) {
		this._fields.stack.value = value
	}

	// just args
	public get argLen(): uintptr {
		return this._fields.argLen.value
	}
	public set argLen(value: uintptr) {
		this._fields.argLen.value = value
	}

	public get regPtrs(): abi.IntArgRegBitmap {
		return this._fields.regPtrs.value
	}
	public set regPtrs(value: abi.IntArgRegBitmap) {
		this._fields.regPtrs.value = value
	}

	public _fields: {
		fn: $.VarRef<uintptr>;
		stack: $.VarRef<bitVector | null>;
		argLen: $.VarRef<uintptr>;
		regPtrs: $.VarRef<abi.IntArgRegBitmap>;
	}

	constructor(init?: Partial<{argLen?: uintptr, fn?: uintptr, regPtrs?: abi.IntArgRegBitmap, stack?: bitVector | null}>) {
		this._fields = {
			fn: $.varRef(init?.fn ?? 0),
			stack: $.varRef(init?.stack ?? null),
			argLen: $.varRef(init?.argLen ?? 0),
			regPtrs: $.varRef(init?.regPtrs ?? new abi.IntArgRegBitmap())
		}
	}

	public clone(): makeFuncCtxt {
		const cloned = new makeFuncCtxt()
		cloned._fields = {
			fn: $.varRef(this._fields.fn.value),
			stack: $.varRef(this._fields.stack.value),
			argLen: $.varRef(this._fields.argLen.value),
			regPtrs: $.varRef(this._fields.regPtrs.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'makeFuncCtxt',
	  new makeFuncCtxt(),
	  [],
	  makeFuncCtxt,
	  {"fn": { kind: $.TypeKind.Basic, name: "uintptr" }, "stack": { kind: $.TypeKind.Pointer, elemType: "bitVector" }, "argLen": { kind: $.TypeKind.Basic, name: "uintptr" }, "regPtrs": "IntArgRegBitmap"}
	);
}

// moveMakeFuncArgPtrs uses ctxt.regPtrs to copy integer pointer arguments
// in args.Ints to args.Ptrs where the GC can see them.
//
// This is similar to what reflectcallmove does in the runtime, except
// that happens on the return path, whereas this happens on the call path.
//
// nosplit because pointers are being held in uintptr slots in args, so
// having our stack scanned now could lead to accidentally freeing
// memory.
//
//go:nosplit
export function moveMakeFuncArgPtrs(ctxt: makeFuncCtxt | null, args: abi.RegArgs | null): void {

	// Avoid write barriers! Because our write barrier enqueues what
	// was there before, we might enqueue garbage.

	// We *must* zero this space ourselves because it's defined in
	// assembly code and the GC will scan these pointers. Otherwise,
	// there will be garbage here.
	for (let i = 0; i < $.len(args!.Ints); i++) {
		const arg = args!.Ints![i]
		{
			// Avoid write barriers! Because our write barrier enqueues what
			// was there before, we might enqueue garbage.

			// We *must* zero this space ourselves because it's defined in
			// assembly code and the GC will scan these pointers. Otherwise,
			// there will be garbage here.
			if (ctxt!.regPtrs.Get(i)) {
				(uintptr!)(unsafe.Pointer(args!.Ptrs![i]))!.value = arg
			} else {
				// We *must* zero this space ourselves because it's defined in
				// assembly code and the GC will scan these pointers. Otherwise,
				// there will be garbage here.
				(uintptr!)(unsafe.Pointer(args!.Ptrs![i]))!.value = 0
			}
		}
	}
}

