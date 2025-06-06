import { Type, Value, ValueOf } from './type.js'
import { uintptr } from './types.js'

import * as iter from '@goscript/iter/index.js'

export function rangeNum<
  T extends
    | number
    | uintptr,
  N extends number | number,
>(num: N, t: Type): iter.Seq<Value> {
  // cannot use range T(v) because no core type.

  // if the iteration value type is define by
  // type T built-in type.
  return (_yield: ((v: Value) => boolean) | null): void => {
    let convert = t!.PkgPath!() != ''
    // cannot use range T(v) because no core type.

    // if the iteration value type is define by
    // type T built-in type.
    for (let i = 0 as unknown as T; i < (num as unknown as T); i++) {
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
