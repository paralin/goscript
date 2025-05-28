import * as $ from "@goscript/builtin/builtin.js";
import { Type, Value, uintptr } from "./reflect.gs.js";
import { MakeFunc } from "./makefunc.gs.js";
import { canRangeFunc, canRangeFunc2 } from "./type.gs.js";
import { ValueOf } from "./value.gs.js";

import * as iter from "@goscript/iter/index.js"

export function rangeNum<T extends number | number | number | number | number | number | number | number | number | number | uintptr, N extends number | number>(num: N, t: Type): iter.Seq<Value> {

	// cannot use range T(v) because no core type.

	// if the iteration value type is define by
	// type T built-in type.
	return (_yield: ((v: Value) => boolean) | null): void => {
		let convert = t!.PkgPath!() != ""
		// cannot use range T(v) because no core type.

		// if the iteration value type is define by
		// type T built-in type.
		for (let i = (0 as unknown as T); i < (num as unknown as T); i++) {
			let tmp = ValueOf(i).clone()
			// if the iteration value type is define by
			// type T built-in type.
			if (convert) {
				tmp = tmp.Convert(t).clone()
			}
			if (!_yield!(tmp)) {
				return 
			}
		}
	}
}

