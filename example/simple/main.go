package main

// MyStruct demonstrates a simple struct with public and private fields.
// It will be converted into a TypeScript class by goscript.
type MyStruct struct {
	// MyInt is a public integer field, initialized to zero.
	MyInt int
	// MyString is a public string field, initialized to empty string.
	MyString string
	// myBool is a private boolean field, initialized to false.
	myBool bool
}

// GetMyString returns the MyString field.
func (m *MyStruct) GetMyString() string {
	return m.MyString
}

// GetMyBool returns the myBool field.
func (m *MyStruct) GetMyBool() bool {
	return m.myBool
}

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
	return MyStruct{MyString: s}
}

func vals() (int, int) {
	return 1, 2
}

func main() {
	println("Hello from GoScript example!")

	// Basic arithmetic
	a, b := 10, 3
	println("Addition:", a+b, "Subtraction:", a-b, "Multiplication:", a*b, "Division:", a/b, "Modulo:", a%b)

	// Boolean logic and comparisons
	println("Logic &&:", true && false, "||:", true || false, "!:!", !true)
	println("Comparisons:", a == b, a != b, a < b, a > b, a <= b, a >= b)

	// string(rune) conversion
	var r rune = 'X'
	s := string(r)
	println("string('X'):", s)

	var r2 rune = 121 // 'y'
	s2 := string(r2)
	println("string(121):", s2)

	var r3 rune = 0x221A // '√'
	s3 := string(r3)
	println("string(0x221A):", s3)

	// Arrays
	arr := [3]int{1, 2, 3}
	println("Array elements:", arr[0], arr[1], arr[2])

	// Slices - Basic initialization and access
	slice := []int{4, 5, 6}
	println("Slice elements:", slice[0], slice[1], slice[2])
	println("Slice length:", len(slice), "capacity:", cap(slice))

	sliceWithCap := make([]int, 3, 5)
	println("\nSlice created with make([]int, 3, 5):")
	println("Length:", len(sliceWithCap), "Capacity:", cap(sliceWithCap))

	println("\nAppend and capacity growth:")
	growingSlice := make([]int, 0, 2)
	println("Initial - Length:", len(growingSlice), "Capacity:", cap(growingSlice))

	for i := 1; i <= 4; i++ {
		growingSlice = append(growingSlice, i)
		println("After append", i, "- Length:", len(growingSlice), "Capacity:", cap(growingSlice))
	}

	println("\nSlicing operations and shared backing arrays:")
	original := []int{10, 20, 30, 40, 50}
	println("Original slice - Length:", len(original), "Capacity:", cap(original))

	slice1 := original[1:3]
	println("slice1 := original[1:3] - Values:", slice1[0], slice1[1])
	println("slice1 - Length:", len(slice1), "Capacity:", cap(slice1))

	slice2 := original[1:3:4]
	println("slice2 := original[1:3:4] - Values:", slice2[0], slice2[1])
	println("slice2 - Length:", len(slice2), "Capacity:", cap(slice2))

	println("\nShared backing arrays:")
	slice1[0] = 999
	println("After slice1[0] = 999:")
	println("original[1]:", original[1], "slice1[0]:", slice1[0], "slice2[0]:", slice2[0])

	sum := 0
	for idx, val := range slice {
		sum += val
		println("Range idx:", idx, "val:", val)
	}
	println("Range sum:", sum)

	// Basic for loop
	prod := 1
	for i := 1; i <= 3; i++ {
		prod *= i
	}
	println("Product via for:", prod)

	// Struct, pointers, copy independence
	instance := NewMyStruct("go-script")
	println("instance.MyString:", instance.GetMyString())
	instance.MyInt = 42
	copyInst := instance
	copyInst.MyInt = 7
	println("instance.MyInt:", instance.MyInt, "copyInst.MyInt:", copyInst.MyInt)

	// Pointer initialization and dereference assignment
	ptr := new(MyStruct)
	ptr.MyInt = 9
	println("ptr.MyInt:", ptr.MyInt)
	deref := *ptr
	deref.MyInt = 8
	println("After deref assign, ptr.MyInt:", ptr.MyInt, "deref.MyInt:", deref.MyInt)

	// Method calls on pointer receiver
	ptr.myBool = true
	println("ptr.GetMyBool():", ptr.GetMyBool())

	// Composite literal assignment
	comp := MyStruct{MyInt: 100, MyString: "composite", myBool: false}
	println("comp fields:", comp.MyInt, comp.GetMyString(), comp.GetMyBool())

	// Multiple return values and blank identifier
	x, _ := vals()
	_, y := vals()
	println("vals x:", x, "y:", y)

	// If/else
	if a > b {
		println("If branch: a>b")
	} else {
		println("Else branch: a<=b")
	}

	// Switch statement
	switch a {
	case 10:
		println("Switch case 10")
	default:
		println("Switch default")
	}

	// Goroutines and Channels
	println("\nGoroutines and Channels:")
	ch := make(chan string)
	go func() {
		println("Goroutine: Sending message")
		ch <- "Hello from goroutine!"
	}()

	msg := <-ch
	println("Main goroutine: Received message:", msg)

	// Select statement
	println("\nSelect statement:")
	selectCh := make(chan string)
	go func() {
		selectCh <- "Message from select goroutine!"
	}()
	anotherCh := make(chan string)
	select {
	case selectMsg := <-selectCh:
		println("Select received:", selectMsg)
	case anotherMsg := <-anotherCh: // Add another case
		println("Select received from another channel:", anotherMsg)
	}

	// Function Literals
	println("\nFunction Literals:")
	add := func(x, y int) int {
		return x + y
	}
	sum = add(5, 7)
	println("Function literal result:", sum)
}
