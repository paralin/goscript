// Export the main reflect functions organized like Go stdlib
export { TypeOf, ValueOf, Value, Kind, ArrayOf, SliceOf, PointerTo, PtrTo } from "./type";
export type { Type } from "./type";
export { DeepEqual } from "./deepequal";
export { Zero, Copy, Indirect, New, MakeSlice, MakeMap, Append } from "./value";
export { Swapper } from "./swapper";
export { MapOf } from "./map_swiss.gs";

// Export new types and constants
export { 
    ChanDir, RecvDir, SendDir, BothDir,
    StructTag, ValueError,
    SelectDir, SelectSend, SelectRecv, SelectDefault,
    bitVector
} from "./types";
export type { 
    uintptr, Pointer, StructField, Method, SelectCase, 
    SliceHeader, StringHeader, MapIter 
} from "./types";

// Export kind constants
export { 
    Invalid, Bool, Int, Int8, Int16, Int32, Int64,
    Uint, Uint8, Uint16, Uint32, Uint64, Uintptr,
    Float32, Float64, Complex64, Complex128,
    Array, Chan, Func, Interface, Map, Ptr, Slice, String, Struct, UnsafePointer
} from "./type"; 