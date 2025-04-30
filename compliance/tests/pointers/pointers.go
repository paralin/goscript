package main

/* not currently working correctly */
/* @ts-ignore */
/* eslint-disable-file */

type MyStruct struct {
	Val int
}

func main() {
	s1 := MyStruct{Val: 1} // p1 takes the address of s1, so s1 is boxed
	s2 := MyStruct{Val: 2} // p2 takes the address of s2, so s2 is boxed

	p1 := &s1 // *MyStruct, points to s1, pp1 takes the address of p1, so p1 is boxed
	p2 := &s1 // *MyStruct, points to s1, pp2 takes the address of p2, so p2 is boxed
	p3 := &s2 // *MyStruct, points to s2, pp3 takes the address of p3, so p3 is boxed

	p4 := &s1 // *MyStruct, points to s1, nothing takes the address of p4, so p4 is not boxed
	_ = p4

	pp1 := &p1 // **MyStruct, points to p1
	pp2 := &p2 // **MyStruct, points to p2
	pp3 := &p3 // **MyStruct, points to p3

	ppp1 := &pp1 // ***MyStruct, points to pp1, not boxed as nothing takes address of ppp1

	println("--- Initial Values ---")
	println("s1.Val:", s1.Val)   // 1
	println("s2.Val:", s2.Val)   // 2
	println("p1==p2:", p1 == p2) // true
	println("p1==p3:", p1 == p3) // false

	// --- Pointer Comparisons ---
	println("\n--- Pointer Comparisons ---")
	println("pp1==pp2:", pp1 == pp2)                                   // false
	println("pp1==pp3:", pp1 == pp3)                                   // false
	println("*pp1==*pp2:", *pp1 == *pp2)                               // true
	println("*pp1==*pp3:", *pp1 == *pp3)                               // false
	println("(**pp1).Val == (**pp2).Val:", (**pp1).Val == (**pp2).Val) // true
	println("(**pp1).Val == (**pp3).Val:", (**pp1).Val == (**pp3).Val) // false

	// Triple pointer comparisons
	println("ppp1==ppp1:", ppp1 == ppp1)                         // true
	println("*ppp1==pp1:", *ppp1 == pp1)                         // true
	println("**ppp1==p1:", **ppp1 == p1)                         // true
	println("(***ppp1).Val == s1.Val:", (***ppp1).Val == s1.Val) // true

	// --- Modifications through Pointers ---
	println("\n--- Modifications ---")
	*p1 = MyStruct{Val: 10} // Modify s1 via p1
	println("After *p1 = {Val: 10}:")
	println("  s1.Val:", s1.Val)               // 10
	println("  (*p2).Val:", (*p2).Val)         // 10
	println("  (**pp1).Val:", (**pp1).Val)     // 10
	println("  (***ppp1).Val:", (***ppp1).Val) // 10
	println("  s2.Val:", s2.Val)               // 2 (unmodified)

	**pp3 = MyStruct{Val: 20} // Modify s2 via pp3 -> p3
	println("After **pp3 = {Val: 20}:")
	println("  s2.Val:", s2.Val)       // 20
	println("  (*p3).Val:", (*p3).Val) // 20
	println("  s1.Val:", s1.Val)       // 10 (unmodified)

	// --- Nil Pointers ---
	println("\n--- Nil Pointers ---")
	var np *MyStruct = nil
	var npp **MyStruct = nil
	var nppp ***MyStruct = nil

	println("np == nil:", np == nil)     // true
	println("npp == nil:", npp == nil)   // true
	println("nppp == nil:", nppp == nil) // true

	npp = &np // npp now points to np (which is nil)
	println("After npp = &np:")
	println("  npp == nil:", npp == nil)   // false
	println("  *npp == nil:", *npp == nil) // true
}
