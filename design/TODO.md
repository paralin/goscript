# Known TODOs

## More Specific Type Registrations

We register types like this:

```typescript
	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'content',
	  new content(),
	  [{ name: "ReadAt", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }, { name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "ProcessData", args: [{ name: "input", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "string" } }, { type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  content,
	  {"bytes": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
```

But we need to register with the full package name for each type, otherwise there will be collisions.

This registration is done to avoid circular references using string identifiers as aliases. Unfortunately I have not seen any alternative way to do this.

