package main

func main() {
	// === string(string) Conversion ===
	myVar := string("hello world")
	println(myVar)

	// === string(rune) Conversion ===
	r := 'A'
	s := string(r)
	println(s)

	var r2 rune = 97 // 'a'
	s2 := string(r2)
	println(s2)

	var r3 rune = 0x20AC // '€'
	s3 := string(r3)
	println(s3)

	// === string([]rune) Conversion ===
	myRunes := []rune{'G', 'o', 'S', 'c', 'r', 'i', 'p', 't'}
	myStringFromRunes := string(myRunes)
	println(myStringFromRunes)

	emptyRunes := []rune{}
	emptyStringFromRunes := string(emptyRunes)
	println(emptyStringFromRunes)

	// === []rune(string) and string([]rune) Round Trip ===
	originalString := "你好世界" // Example with multi-byte characters
	runesFromString := []rune(originalString)
	stringFromRunes := string(runesFromString)
	println(originalString)
	println(stringFromRunes)
	println(originalString == stringFromRunes)

	// === Modify []rune and convert back to string ===
	mutableRunes := []rune("Mutable String")
	mutableRunes[0] = 'm'
	mutableRunes[8] = 's'
	modifiedString := string(mutableRunes)
	println(modifiedString)
}
