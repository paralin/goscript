import * as $ from "@goscript/builtin/builtin.js";
import { Type, Value, Kind, Bool, Int, String, Slice, Ptr } from "./reflect.gs.js";

// Export ValueOf and valueInterface for compatibility with generated code
export { ValueOf } from "./reflect.gs.js";

// valueInterface is used by deepequal - just return the underlying value
export function valueInterface(v: Value, safe?: boolean): any {
    return (v as any)._value;
}

// methodReceiver is used by makefunc - placeholder implementation
export function methodReceiver(op: string, v: Value, methodIndex: number): Value {
    // Placeholder implementation
    return v;
} 