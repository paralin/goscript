import * as $ from "@goscript/builtin/builtin.js";

// simplify1 implements Simplify for the unary OpStar,
// OpPlus, and OpQuest operators. It returns the simple regexp
// equivalent to
//
//	Regexp{Op: op, Flags: flags, Sub: {sub}}
//
// under the assumption that sub is already simple, and
// without first allocating that structure. If the regexp
// to be returned turns out to be equivalent to re, simplify1
// returns re instead.
//
// simplify1 is factored out of Simplify because the implementation
// for other operators generates these unary expressions.
// Letting them call simplify1 makes sure the expressions they
// generate are simple.
export function simplify1(op: Op, flags: Flags, sub: Regexp | null, re: Regexp | null): Regexp | null {
	// Special case: repeat the empty string as much as
	// you want, but it's still the empty string.
	if (sub!.Op == 2) {
		return sub
	}
	// The operators are idempotent if the flags match.
	if (op == sub!.Op && (flags & 32) == (sub!.Flags & 32)) {
		return sub
	}
	if (re != null && re!.Op == op && (re!.Flags & 32) == (flags & 32) && (sub === re!.Sub![0])) {
		return re
	}

	re = new Regexp({Flags: flags, Op: op})
	re!.Sub = $.append($.goSlice(re!.Sub0, undefined, 0), sub)
	return re
}

