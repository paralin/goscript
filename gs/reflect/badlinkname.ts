import { Type, Kind } from "./type.js";

// Define missing types that are referenced but not yet implemented
export interface StructField {
    Name: string;
    Type: Type;
    Tag?: string;
    Offset?: number;
    Index?: number[];
    Anonymous?: boolean;
}

export interface Method {
    Name: string;
    Type: Type;
    Func: any;
    Index: number;
}

export interface ChanDir {
    valueOf(): number;
}

export interface Pointer {
    // Placeholder for pointer type
}

// ifaceIndir reports whether t is stored indirectly in an interface value.
// It is no longer used by this package and is here entirely for the
// linkname uses.
//
//go:linkname unusedIfaceIndir reflect.ifaceIndir
export function unusedIfaceIndir(t: any): boolean {
	// return (t.Kind_ & abi.KindDirectIface) == 0
	return false; // placeholder
}

//go:linkname badlinkname_rtype_Align reflect.(*rtype).Align
export function badlinkname_rtype_Align(): number { return 0; }

//go:linkname badlinkname_rtype_AssignableTo reflect.(*rtype).AssignableTo
export function badlinkname_rtype_AssignableTo(u: Type): boolean { return false; }

//go:linkname badlinkname_rtype_Bits reflect.(*rtype).Bits
export function badlinkname_rtype_Bits(): number { return 0; }

//go:linkname badlinkname_rtype_ChanDir reflect.(*rtype).ChanDir
export function badlinkname_rtype_ChanDir(): ChanDir { return { valueOf: () => 0 }; }

//go:linkname badlinkname_rtype_Comparable reflect.(*rtype).Comparable
export function badlinkname_rtype_Comparable(): boolean { return false; }

//go:linkname badlinkname_rtype_ConvertibleTo reflect.(*rtype).ConvertibleTo
export function badlinkname_rtype_ConvertibleTo(u: Type): boolean { return false; }

//go:linkname badlinkname_rtype_Elem reflect.(*rtype).Elem
export function badlinkname_rtype_Elem(): Type { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_Field reflect.(*rtype).Field
export function badlinkname_rtype_Field(i: number): StructField { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_FieldAlign reflect.(*rtype).FieldAlign
export function badlinkname_rtype_FieldAlign(): number { return 0; }

//go:linkname badlinkname_rtype_FieldByIndex reflect.(*rtype).FieldByIndex
export function badlinkname_rtype_FieldByIndex(index: number[]): StructField { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_FieldByName reflect.(*rtype).FieldByName
export function badlinkname_rtype_FieldByName(name: string): [StructField, boolean] { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_FieldByNameFunc reflect.(*rtype).FieldByNameFunc
export function badlinkname_rtype_FieldByNameFunc(match: (name: string) => boolean): [StructField, boolean] { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_Implements reflect.(*rtype).Implements
export function badlinkname_rtype_Implements(u: Type): boolean { return false; }

//go:linkname badlinkname_rtype_In reflect.(*rtype).In
export function badlinkname_rtype_In(i: number): Type { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_IsVariadic reflect.(*rtype).IsVariadic
export function badlinkname_rtype_IsVariadic(): boolean { return false; }

//go:linkname badlinkname_rtype_Key reflect.(*rtype).Key
export function badlinkname_rtype_Key(): Type { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_Kind reflect.(*rtype).Kind
export function badlinkname_rtype_Kind(): Kind { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_Len reflect.(*rtype).Len
export function badlinkname_rtype_Len(): number { return 0; }

//go:linkname badlinkname_rtype_Method reflect.(*rtype).Method
export function badlinkname_rtype_Method(i: number): Method { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_MethodByName reflect.(*rtype).MethodByName
export function badlinkname_rtype_MethodByName(name: string): [Method, boolean] { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_Name reflect.(*rtype).Name
export function badlinkname_rtype_Name(): string { return ""; }

//go:linkname badlinkname_rtype_NumField reflect.(*rtype).NumField
export function badlinkname_rtype_NumField(): number { return 0; }

//go:linkname badlinkname_rtype_NumIn reflect.(*rtype).NumIn
export function badlinkname_rtype_NumIn(): number { return 0; }

//go:linkname badlinkname_rtype_NumMethod reflect.(*rtype).NumMethod
export function badlinkname_rtype_NumMethod(): number { return 0; }

//go:linkname badlinkname_rtype_NumOut reflect.(*rtype).NumOut
export function badlinkname_rtype_NumOut(): number { return 0; }

//go:linkname badlinkname_rtype_Out reflect.(*rtype).Out
export function badlinkname_rtype_Out(i: number): Type { throw new Error("not implemented"); }

//go:linkname badlinkname_rtype_PkgPath reflect.(*rtype).PkgPath
export function badlinkname_rtype_PkgPath(): string { return ""; }

//go:linkname badlinkname_rtype_Size reflect.(*rtype).Size
export function badlinkname_rtype_Size(): number { return 0; }

//go:linkname badlinkname_rtype_String reflect.(*rtype).String
export function badlinkname_rtype_String(): string { return ""; }

//go:linkname badlinkname_rtype_ptrTo reflect.(*rtype).ptrTo
export function badlinkname_rtype_ptrTo(): any { return null; }

//go:linkname badlinkname_Value_pointer reflect.(*Value).pointer
export function badlinkname_Value_pointer(): Pointer { return {}; }

