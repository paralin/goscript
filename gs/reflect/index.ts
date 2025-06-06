// Export the main reflect functions organized like Go stdlib
export {
  TypeOf,
  ValueOf,
  Value,
  Kind_String,
  ArrayOf,
  SliceOf,
  PointerTo,
  PtrTo,
  MapOf,
  ChanOf,
  ChanDir_String,
  RecvDir,
  SendDir,
  BothDir,
} from './type.js'
export type { Type, ChanDir, Kind } from './type.js'
export { DeepEqual } from './deepequal.js'
export {
  Zero,
  Copy,
  Indirect,
  New,
  MakeSlice,
  MakeMap,
  Append,
  MakeChan,
  Select,
} from './value.js'
export { Swapper } from './swapper.js'

// Export new types and constants
export {
  StructTag,
  ValueError,
  SelectDir,
  SelectSend,
  SelectRecv,
  SelectDefault,
  bitVector,
} from './types.js'
export type {
  uintptr,
  Pointer,
  StructField,
  Method,
  SelectCase,
  SliceHeader,
  StringHeader,
  MapIter,
} from './types.js'

// Export kind constants
export {
  Invalid,
  Bool,
  Int,
  Int8,
  Int16,
  Int32,
  Int64,
  Uint,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Uintptr,
  Float32,
  Float64,
  Complex64,
  Complex128,
  Array,
  Chan,
  Func,
  Interface,
  Map,
  Ptr,
  Slice,
  String,
  Struct,
  UnsafePointer,
} from './type.js'
