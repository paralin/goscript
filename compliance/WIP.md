/*
# Pointer-handling work plan

## 1 Status quo

Current generator already:
• emits pointer **types** as `goscript.Ptr<T>` (`compile_expr.go` → WriteStarExprType)  
• produces pointers with `goscript.makePtr(...)` for the address-of op (`&`)  
• dereferences via the `._ptr/.ref` accessors handled by `WriteStarExprValue`
so most of the newly-designed runtime API is already in use.

## 2 Required compiler tweaks

1. Guarantee we always reference the exported alias
  `Ptr<T>` that lives in the _goscript_ namespace:
  • ensure `WriteStarExprType` writes **`goscript.Ptr<…>`**  
    (existing path is correct – keep).

2. Address-of (`&`)  
  Already compiled to `goscript.makePtr(v)` – no change.

3. Dereference (`*ptr`)  
  Current code emits `(<expr>).ref`, which is still valid because
  `goPtrProxy` exposes `.ref`.  No change required.

4. Interface assignability issue  
  No generator changes needed; it is solved by the new
  `Ptr<T> = (goPtrProxy<T> & T) | null` intersection type.

## 3 Future considerations / design notes

* The generator currently peeks at `.ref` directly for field/method access on
  pointer receivers.  Thanks to the intersection type this is no longer
  necessary – optional chaining on the pointer itself would suffice.  
  Keeping the existing emission is harmless but could be simplified later.

* To save bundle size we might export `Ptr` directly from the runtime namespace
  and let the code emit `goscript.Ptr` while re-exporting:
  `export { Ptr } from "./pointer";` – no compiler impact.

* If we later allow multi-level pointers (`**T`) the generator must loop
  and nest `goscript.Ptr<...>` appropriately.

*/
