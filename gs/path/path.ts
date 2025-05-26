import * as $ from "@goscript/builtin/builtin.js";

class lazybuf {
	public get s(): string {
		return this._fields.s.value
	}
	public set s(value: string) {
		this._fields.s.value = value
	}

	public get buf(): Uint8Array | null {
		return this._fields.buf.value
	}
	public set buf(value: Uint8Array | null) {
		this._fields.buf.value = value
	}

	public get w(): number {
		return this._fields.w.value
	}
	public set w(value: number) {
		this._fields.w.value = value
	}

	public _fields: {
		s: $.VarRef<string>;
		buf: $.VarRef<Uint8Array | null>;
		w: $.VarRef<number>;
	}

	constructor(init?: Partial<{buf?: Uint8Array, s?: string, w?: number}>) {
		this._fields = {
			s: $.varRef(init?.s ?? ""),
			buf: $.varRef(init?.buf ?? null),
			w: $.varRef(init?.w ?? 0)
		}
	}

	public clone(): lazybuf {
		const cloned = new lazybuf()
		cloned._fields = {
			s: $.varRef(this._fields.s.value),
			buf: $.varRef(this._fields.buf.value),
			w: $.varRef(this._fields.w.value)
		}
		return cloned
	}

	public index(i: number): number {
		const b = this
		if (b!.buf != null) {
			return b!.buf![i]
		}
		return $.indexString(b!.s, i)
	}

	public append(c: number): void {
		const b = this
		if (b!.buf == null) {
			if (b!.w < $.len(b!.s) && $.indexString(b!.s, b!.w) == c) {
				b!.w++
				return 
			}
			b!.buf = new Uint8Array($.len(b!.s))
			$.copy(b!.buf, $.stringToBytes($.sliceString(b!.s, undefined, b!.w)))
		}
		b!.buf![b!.w] = c
		b!.w++
	}

	public _string(): string {
		const b = this
		if (b!.buf == null) {
			return $.sliceString(b!.s, undefined, b!.w)
		}
		return $.bytesToString(b!.buf.subarray(0, b!.w))
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'lazybuf',
	  new lazybuf(),
	  [{ name: "index", args: [{ name: "i", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "append", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }, { name: "string", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  lazybuf,
	  {"s": { kind: $.TypeKind.Basic, name: "string" }, "buf": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "w": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// Clean returns the shortest path name equivalent to path
// by purely lexical processing. It applies the following rules
// iteratively until no further processing can be done:
//
//  1. Replace multiple slashes with a single slash.
//  2. Eliminate each . path name element (the current directory).
//  3. Eliminate each inner .. path name element (the parent directory)
//     along with the non-.. element that precedes it.
//  4. Eliminate .. elements that begin a rooted path:
//     that is, replace "/.." by "/" at the beginning of a path.
//
// The returned path ends in a slash only if it is the root "/".
//
// If the result of this process is an empty string, Clean
// returns the string ".".
//
// See also Rob Pike, "Lexical File Names in Plan 9 or
// Getting Dot-Dot Right,"
// https://9p.io/sys/doc/lexnames.html
export function Clean(path: string): string {
	if (path == "") {
		return "."
	}

	let rooted = $.indexString(path, 0) == 47
	let n = $.len(path)

	// Invariants:
	//	reading from path; r is index of next byte to process.
	//	writing to buf; w is index of next byte to write.
	//	dotdot is index in buf where .. must stop, either because
	//		it is the leading slash or it is a leading ../../.. prefix.
	let out = new lazybuf({s: path})
	let r = 0
	let dotdot = 0
	if (rooted) {
		out.append(47)
		r = 1
		dotdot = 1
	}

	// empty path element

	// . element

	// .. element: remove to last /

	// can backtrack

	// cannot backtrack, but not rooted, so append .. element.

	// real path element.
	// add slash if needed

	// copy element
	for (; r < n; ) {

		// empty path element

		// . element

		// .. element: remove to last /

		// can backtrack

		// cannot backtrack, but not rooted, so append .. element.

		// real path element.
		// add slash if needed

		// copy element
		switch (true) {
			case $.indexString(path, r) == 47:
				r++
				break
			case $.indexString(path, r) == 46 && (r + 1 == n || $.indexString(path, r + 1) == 47):
				r++
				break
			case $.indexString(path, r) == 46 && $.indexString(path, r + 1) == 46 && (r + 2 == n || $.indexString(path, r + 2) == 47):
				r += 2
				switch (true) {
					case out.w > dotdot:
						out.w--
						for (; out.w > dotdot && out.index(out.w) != 47; ) {
							out.w--
						}
						break
					case !rooted:
						if (out.w > 0) {
							out.append(47)
						}
						out.append(46)
						out.append(46)
						dotdot = out.w
						break
				}
				break
			default:
				if (rooted && out.w != 1 || !rooted && out.w != 0) {
					out.append(47)
				}
				for (; r < n && $.indexString(path, r) != 47; r++) {
					out.append($.indexString(path, r))
				}
				break
		}
	}

	// Turn empty string into "."
	if (out.w == 0) {
		return "."
	}

	return out._string()
}

// Split splits path immediately following the final slash,
// separating it into a directory and file name component.
// If there is no slash in path, Split returns an empty dir and
// file set to path.
// The returned values have the property that path = dir+file.
export function Split(path: string): [string, string] {
	let i = path.lastIndexOf("/")
	return [$.sliceString(path, undefined, i + 1), $.sliceString(path, i + 1, undefined)]
}

// Join joins any number of path elements into a single path,
// separating them with slashes. Empty elements are ignored.
// The result is Cleaned. However, if the argument list is
// empty or all its elements are empty, Join returns
// an empty string.
export function Join(...elem: string[]): string {
	let size = 0
	for (let _i = 0; _i < $.len(elem); _i++) {
		const e = elem![_i]
		{
			size += $.len(e)
		}
	}
	if (size == 0) {
		return ""
	}
	let buf: string[] = []
	for (let _i = 0; _i < $.len(elem); _i++) {
		const e = elem![_i]
		{
			if ($.len(buf) > 0 || e != "") {
				if ($.len(buf) > 0) {
					buf.push("/")
				}
				buf.push(e)
			}
		}
	}
	return Clean(buf.join(""))
}

// Ext returns the file name extension used by path.
// The extension is the suffix beginning at the final dot
// in the final slash-separated element of path;
// it is empty if there is no dot.
export function Ext(path: string): string {
	for (let i = $.len(path) - 1; i >= 0 && $.indexString(path, i) != 47; i--) {
		if ($.indexString(path, i) == 46) {
			return $.sliceString(path, i, undefined)
		}
	}
	return ""
}

// Base returns the last element of path.
// Trailing slashes are removed before extracting the last element.
// If the path is empty, Base returns ".".
// If the path consists entirely of slashes, Base returns "/".
export function Base(path: string): string {
	if (path == "") {
		return "."
	}
	// Strip trailing slashes.
	for (; $.len(path) > 0 && $.indexString(path, $.len(path) - 1) == 47; ) {
		path = $.sliceString(path, 0, $.len(path) - 1)
	}
	// Find the last element
	{
		let i = path.lastIndexOf("/")
		if (i >= 0) {
			path = $.sliceString(path, i + 1, undefined)
		}
	}
	// If empty now, it had only slashes.
	if (path == "") {
		return "/"
	}
	return path
}

// IsAbs reports whether the path is absolute.
export function IsAbs(path: string): boolean {
	return $.len(path) > 0 && $.indexString(path, 0) == 47
}

// Dir returns all but the last element of path, typically the path's directory.
// After dropping the final element using [Split], the path is Cleaned and trailing
// slashes are removed.
// If the path is empty, Dir returns ".".
// If the path consists entirely of slashes followed by non-slash bytes, Dir
// returns a single slash. In any other case, the returned path does not end in a
// slash.
export function Dir(path: string): string {
	let [dir, ] = Split(path)
	return Clean(dir)
}

