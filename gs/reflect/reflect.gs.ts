import * as $ from "@goscript/builtin/builtin.js";

// TypeScript-native reflect implementation
// This is a simplified version that provides the basic functionality needed

// Missing types that are referenced in generated code
export type uintptr = number;
export type Pointer = any;

// StructField represents a single field in a struct
export class StructField {
    public Name: string = "";
    public Type: Type = new BasicType(Invalid, "invalid");
    public Tag?: string;
    public Offset?: uintptr;
    public Index?: number[];
    public Anonymous?: boolean;

    constructor(init?: Partial<StructField>) {
        if (init) {
            Object.assign(this, init);
        }
    }

    public clone(): StructField {
        return new StructField({
            Name: this.Name,
            Type: this.Type,
            Tag: this.Tag,
            Offset: this.Offset,
            Index: this.Index ? [...this.Index] : undefined,
            Anonymous: this.Anonymous
        });
    }
}

// bitVector class for tracking pointers
export class bitVector {
    private bits: number[] = [];
    
    Set(index: number): void {
        const wordIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        while (this.bits.length <= wordIndex) {
            this.bits.push(0);
        }
        this.bits[wordIndex] |= (1 << bitIndex);
    }
    
    Get(index: number): boolean {
        const wordIndex = Math.floor(index / 32);
        const bitIndex = index % 32;
        if (wordIndex >= this.bits.length) {
            return false;
        }
        return (this.bits[wordIndex] & (1 << bitIndex)) !== 0;
    }
}

// flag type for internal use
export class flag {
    constructor(private _value: number | Kind) {
        if (typeof _value === 'number') {
            this._value = _value;
        } else {
            this._value = _value.valueOf();
        }
    }
    
    valueOf(): number {
        return typeof this._value === 'number' ? this._value : this._value.valueOf();
    }

    // Support arithmetic operations
    static from(value: number | Kind): flag {
        return new flag(value);
    }
}

// rtype is the common implementation of most values
export class rtype {
    constructor(public kind: Kind) {}
    
    Kind(): Kind {
        return this.kind;
    }
    
    String(): string {
        return this.kind.String();
    }

    Pointers(): boolean {
        // Return true for pointer-like types
        const k = this.kind.valueOf();
        return k === Ptr.valueOf() || k === Map.valueOf() || k === Slice.valueOf() || k === Interface.valueOf();
    }
}

// funcType represents a function type
export class funcType extends rtype {
    constructor(kind: Kind, public inCount: number = 0, public outCount: number = 0) {
        super(kind);
    }
}

export class Kind {
    constructor(private _value: number) {}

    valueOf(): number {
        return this._value;
    }

    toString(): string {
        return this.String();
    }

    static from(value: number): Kind {
        return new Kind(value);
    }

    public String(): string {
        const kindNames = [
            "invalid", "bool", "int", "int8", "int16", "int32", "int64",
            "uint", "uint8", "uint16", "uint32", "uint64", "uintptr",
            "float32", "float64", "complex64", "complex128",
            "array", "chan", "func", "interface", "map", "ptr", "slice", "string", "struct", "unsafe.Pointer"
        ];
        if (this._value >= 0 && this._value < kindNames.length) {
            return kindNames[this._value];
        }
        return "invalid";
    }
}

// Kind constants
export const Invalid = new Kind(0);
export const Bool = new Kind(1);
export const Int = new Kind(2);
export const Int8 = new Kind(3);
export const Int16 = new Kind(4);
export const Int32 = new Kind(5);
export const Int64 = new Kind(6);
export const Uint = new Kind(7);
export const Uint8 = new Kind(8);
export const Uint16 = new Kind(9);
export const Uint32 = new Kind(10);
export const Uint64 = new Kind(11);
export const Uintptr = new Kind(12);
export const Float32 = new Kind(13);
export const Float64 = new Kind(14);
export const Complex64 = new Kind(15);
export const Complex128 = new Kind(16);
export const Array = new Kind(17);
export const Chan = new Kind(18);
export const Func = new Kind(19);
export const Interface = new Kind(20);
export const Map = new Kind(21);
export const Ptr = new Kind(22);
export const Slice = new Kind(23);
export const String = new Kind(24);
export const Struct = new Kind(25);
export const UnsafePointer = new Kind(26);

export interface Type {
    String(): string;
    Kind(): Kind;
    Elem?(): Type | null;
    NumField?(): number;
    Field?(i: number): StructField;
    PkgPath?(): string;
    common?(): rtype;
}

export class Value {
    constructor(private _value: any = null, private _type: Type = new BasicType(Invalid, "invalid")) {}

    public clone(): Value {
        return new Value(this._value, this._type);
    }

    public Int(): number {
        if (typeof this._value === 'number' && Number.isInteger(this._value)) {
            return this._value;
        }
        throw new Error("reflect: call of reflect.Value.Int on " + this._type.Kind().String() + " Value");
    }

    public String(): string {
        if (typeof this._value === 'string') {
            return this._value;
        }
        return this._type.String();
    }

    public Len(): number {
        if (globalThis.Array.isArray(this._value)) {
            return this._value.length;
        }
        if (typeof this._value === 'string') {
            return this._value.length;
        }
        throw new Error("reflect: call of reflect.Value.Len on " + this._type.Kind().String() + " Value");
    }

    public Kind(): Kind {
        return this._type.Kind();
    }

    public Type(): Type {
        return this._type;
    }
    
    // Add typ() method for compatibility
    public typ(): rtype | null {
        return new rtype(this._type.Kind());
    }

    // Add flag property for compatibility
    public get flag(): number {
        return 0;
    }

    // Add Convert method
    public Convert(t: Type): Value {
        // Simple conversion - just wrap the value with new type
        return new Value(this._value, t);
    }

    // Additional methods needed by deepequal
    public IsValid(): boolean {
        return this._value !== null && this._value !== undefined;
    }

    public IsNil(): boolean {
        return this._value === null || this._value === undefined;
    }

    public UnsafePointer(): Pointer {
        return this._value;
    }

    public Index(i: number): Value {
        if (globalThis.Array.isArray(this._value)) {
            return new Value(this._value[i], getTypeOf(this._value[i]));
        }
        throw new Error("reflect: call of reflect.Value.Index on " + this._type.Kind().String() + " Value");
    }

    public Bytes(): Uint8Array {
        if (this._value instanceof Uint8Array) {
            return this._value;
        }
        throw new Error("reflect: call of reflect.Value.Bytes on " + this._type.Kind().String() + " Value");
    }

    public Elem(): Value {
        // For pointers and interfaces, return the element
        return new Value(this._value, this._type);
    }

    public NumField(): number {
        // Placeholder for struct field count
        return 0;
    }

    public Field(i: number): Value {
        // Placeholder for struct field access
        return new Value(null, new BasicType(Invalid, "invalid"));
    }

    public MapRange(): any {
        // Placeholder for map iteration
        return null;
    }

    public MapIndex(key: Value): Value {
        // Placeholder for map access
        return new Value(null, new BasicType(Invalid, "invalid"));
    }

    public Uint(): number {
        if (typeof this._value === 'number' && this._value >= 0) {
            return this._value;
        }
        throw new Error("reflect: call of reflect.Value.Uint on " + this._type.Kind().String() + " Value");
    }

    public Bool(): boolean {
        if (typeof this._value === 'boolean') {
            return this._value;
        }
        throw new Error("reflect: call of reflect.Value.Bool on " + this._type.Kind().String() + " Value");
    }

    public Float(): number {
        if (typeof this._value === 'number') {
            return this._value;
        }
        throw new Error("reflect: call of reflect.Value.Float on " + this._type.Kind().String() + " Value");
    }

    public Complex(): any {
        // Placeholder for complex number support
        return this._value;
    }

    public pointer(): Pointer {
        return this._value;
    }

    public get ptr(): Pointer {
        return this._value;
    }
}

export class BasicType implements Type {
    constructor(private _kind: Kind, private _name: string) {}

    public String(): string {
        return this._name;
    }

    public Kind(): Kind {
        return this._kind;
    }

    public Elem?(): Type | null {
        return null;
    }

    public NumField?(): number {
        return 0;
    }

    public Field?(i: number): StructField {
        return new StructField();
    }

    public PkgPath?(): string {
        return "";
    }

    public common?(): rtype {
        return new rtype(this._kind);
    }
}

class SliceType implements Type {
    constructor(private _elemType: Type) {}

    public String(): string {
        return "[]" + this._elemType.String();
    }

    public Kind(): Kind {
        return Slice;
    }

    public Elem?(): Type | null {
        return this._elemType;
    }
}

function getTypeOf(value: any): Type {
    if (value === null || value === undefined) {
        return new BasicType(Invalid, "invalid");
    }

    switch (typeof value) {
        case 'boolean':
            return new BasicType(Bool, "bool");
        case 'number':
            if (Number.isInteger(value)) {
                return new BasicType(Int, "int");
            } else {
                return new BasicType(Float64, "float64");
            }
        case 'string':
            return new BasicType(String, "string");
        case 'object':
            if (globalThis.Array.isArray(value)) {
                if (value.length > 0) {
                    const elemType = getTypeOf(value[0]);
                    return new SliceType(elemType);
                } else {
                    // Empty array, assume []interface{}
                    return new SliceType(new BasicType(Interface, "interface{}"));
                }
            }
            break;
    }

    return new BasicType(Interface, "interface{}");
}

export function TypeOf(i: any): Type {
    return getTypeOf(i);
}

export function ValueOf(i: any): Value {
    const type = getTypeOf(i);
    return new Value(i, type);
}

export function DeepEqual(x: any, y: any): boolean {
    if (x === y) {
        return true;
    }

    if (x === null || y === null || x === undefined || y === undefined) {
        return x === y;
    }

    if (typeof x !== typeof y) {
        return false;
    }

    if (globalThis.Array.isArray(x) && globalThis.Array.isArray(y)) {
        if (x.length !== y.length) {
            return false;
        }
        for (let i = 0; i < x.length; i++) {
            if (!DeepEqual(x[i], y[i])) {
                return false;
            }
        }
        return true;
    }

    if (typeof x === 'object' && typeof y === 'object') {
        const keysX = Object.keys(x);
        const keysY = Object.keys(y);
        if (keysX.length !== keysY.length) {
            return false;
        }
        for (const key of keysX) {
            if (!keysY.includes(key) || !DeepEqual(x[key], y[key])) {
                return false;
            }
        }
        return true;
    }

    return false;
}

export function Zero(typ: Type): Value {
    let zeroValue: any;
    
    switch (typ.Kind().valueOf()) {
        case Bool.valueOf():
            zeroValue = false;
            break;
        case Int.valueOf():
        case Int8.valueOf():
        case Int16.valueOf():
        case Int32.valueOf():
        case Int64.valueOf():
        case Uint.valueOf():
        case Uint8.valueOf():
        case Uint16.valueOf():
        case Uint32.valueOf():
        case Uint64.valueOf():
        case Uintptr.valueOf():
        case Float32.valueOf():
        case Float64.valueOf():
            zeroValue = 0;
            break;
        case String.valueOf():
            zeroValue = "";
            break;
        case Slice.valueOf():
        case Array.valueOf():
            zeroValue = [];
            break;
        default:
            zeroValue = null;
            break;
    }

    return new Value(zeroValue, typ);
}

// uintptr class for pointer operations
export class UintptrClass {
    constructor(public value: number) {}
    
    static from(ptr: any): UintptrClass {
        return new UintptrClass(0);
    }

    // Make it callable like a function
    static call(ptr: any): UintptrClass {
        return new UintptrClass(0);
    }
}

// Make uintptr callable
export const uintptr = (ptr: any) => new UintptrClass(0); 