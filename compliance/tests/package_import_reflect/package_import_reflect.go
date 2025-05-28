package main

import "reflect"

// Test struct reflection - moved outside main to avoid export issues
type Person struct {
	Name string
	Age  int
}

// Test interface for type assertions
type Stringer interface {
	String() string
}

func main() {
	// Test basic reflect functions
	x := 42
	v := reflect.ValueOf(x)
	println("Type:", reflect.TypeOf(x).String())
	println("Value:", v.Int())
	println("Kind:", v.Kind().String())

	// Test with string
	s := "hello"
	sv := reflect.ValueOf(s)
	println("String type:", reflect.TypeOf(s).String())
	println("String value:", sv.String())
	println("String kind:", sv.Kind().String())

	// Test with slice
	slice := []int{1, 2, 3}
	sliceV := reflect.ValueOf(slice)
	println("Slice type:", reflect.TypeOf(slice).String())
	println("Slice len:", sliceV.Len())
	println("Slice kind:", sliceV.Kind().String())

	// Test DeepEqual
	a := []int{1, 2, 3}
	b := []int{1, 2, 3}
	c := []int{1, 2, 4}
	println("DeepEqual a==b:", reflect.DeepEqual(a, b))
	println("DeepEqual a==c:", reflect.DeepEqual(a, c))

	// Test Zero value
	zeroInt := reflect.Zero(reflect.TypeOf(42))
	println("Zero int:", zeroInt.Int())

	// Test type construction functions
	intType := reflect.TypeOf(0)
	sliceType := reflect.SliceOf(intType)
	println("SliceOf int:", sliceType.String())
	println("SliceOf kind:", sliceType.Kind().String())

	arrayType := reflect.ArrayOf(5, intType)
	println("ArrayOf 5 int:", arrayType.String())
	println("ArrayOf kind:", arrayType.Kind().String())

	ptrType := reflect.PointerTo(intType)
	println("PointerTo int:", ptrType.String())
	println("PointerTo kind:", ptrType.Kind().String())

	// Test PtrTo (alias for PointerTo)
	ptrType2 := reflect.PtrTo(intType)
	println("PtrTo int:", ptrType2.String())

	// Test New and Indirect
	newVal := reflect.New(intType)
	println("New int type:", newVal.Type().String())
	indirectVal := reflect.Indirect(newVal)
	println("Indirect type:", indirectVal.Type().String())

	// Test Zero values for different types
	zeroString := reflect.Zero(reflect.TypeOf(""))
	println("Zero string:", zeroString.String())

	zeroBool := reflect.Zero(reflect.TypeOf(true))
	println("Zero bool:", zeroBool.String()) // Should show the type since it's not a string

	// Test Swapper function
	testSlice := []int{1, 2, 3, 4, 5}
	swapper := reflect.Swapper(testSlice)
	println("Before swap:", testSlice[0], testSlice[4])
	swapper(0, 4)
	println("After swap:", testSlice[0], testSlice[4])

	// Test Copy function
	src := []int{10, 20, 30}
	dst := make([]int, 2)
	srcVal := reflect.ValueOf(src)
	dstVal := reflect.ValueOf(dst)
	copied := reflect.Copy(dstVal, srcVal)
	println("Copied elements:", copied)
	println("Dst after copy:", dst[0], dst[1])

	// Test struct reflection
	person := Person{Name: "Alice", Age: 30}
	personType := reflect.TypeOf(person)
	println("Struct type:", personType.String())
	println("Struct kind:", personType.Kind().String())

	personVal := reflect.ValueOf(person)
	println("Struct value type:", personVal.Type().String())

	// Test with different kinds
	var f float64 = 3.14
	fVal := reflect.ValueOf(f)
	println("Float kind:", fVal.Kind().String())

	var boolVal bool = true
	bVal := reflect.ValueOf(boolVal)
	println("Bool kind:", bVal.Kind().String())

	// Test type equality
	intType1 := reflect.TypeOf(1)
	intType2 := reflect.TypeOf(2)
	println("Same int types:", intType1.String() == intType2.String())

	stringType := reflect.TypeOf("test")
	println("Different types:", intType1.String() == stringType.String())

	// Test map type construction
	mapType := reflect.MapOf(reflect.TypeOf(""), reflect.TypeOf(0))
	println("MapOf string->int:", mapType.String())
	println("MapOf kind:", mapType.Kind().String())

	// Test channel direction constants
	println("Chan kinds available")

	// Test pointer operations
	// Note: Pointer-to-pointer reflection has a compiler limitation
	// var ptr *int = &x
	// ptrVal := reflect.ValueOf(&ptr)
	// println("Pointer type:", ptrVal.Type().String())
	// println("Pointer kind:", ptrVal.Kind().String())

	// Test interface type
	var iface interface{} = "hello"
	ifaceVal := reflect.ValueOf(iface)
	println("Interface value type:", ifaceVal.Type().String())
	println("Interface kind:", ifaceVal.Kind().String())

	// Test function type
	fn := func(int) string { return "" }
	fnVal := reflect.ValueOf(fn)
	println("Function type:", fnVal.Type().String())
	println("Function kind:", fnVal.Kind().String())

	// Test more complex types
	complexSlice := [][]int{{1, 2}, {3, 4}}
	complexVal := reflect.ValueOf(complexSlice)
	println("Complex slice type:", complexVal.Type().String())
	println("Complex slice kind:", complexVal.Kind().String())
	println("Complex slice len:", complexVal.Len())

	// Test type methods
	println("Type size methods:")
	println("Int size:", reflect.TypeOf(0).Size())
	println("String size:", reflect.TypeOf("").Size())
	println("Slice size:", reflect.TypeOf([]int{}).Size())

	// Test enhanced API surface - functions to implement
	println("Enhanced API tests:")

	// Test MakeSlice
	sliceTypeInt := reflect.SliceOf(reflect.TypeOf(0))
	newSlice := reflect.MakeSlice(sliceTypeInt, 3, 5)
	println("MakeSlice len:", newSlice.Len())
	println("MakeSlice type:", newSlice.Type().String())

	// Test MakeMap
	mapTypeStr := reflect.MapOf(reflect.TypeOf(""), reflect.TypeOf(0))
	newMap := reflect.MakeMap(mapTypeStr)
	println("MakeMap type:", newMap.Type().String())

	// Test Append
	originalSlice := reflect.ValueOf([]int{1, 2})
	appendedSlice := reflect.Append(originalSlice, reflect.ValueOf(3))
	println("Append result len:", appendedSlice.Len())

	// Test channel types
	chanType := reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0))
	println("ChanOf type:", chanType.String())
	println("ChanOf kind:", chanType.Kind().String())

	// Test MakeChan
	newChan := reflect.MakeChan(chanType, 0)
	println("MakeChan type:", newChan.Type().String())

	// Test different channel directions
	sendOnlyChan := reflect.ChanOf(reflect.SendDir, reflect.TypeOf(""))
	println("SendOnly chan type:", sendOnlyChan.String())

	recvOnlyChan := reflect.ChanOf(reflect.RecvDir, reflect.TypeOf(true))
	println("RecvOnly chan type:", recvOnlyChan.String())

	// Test channels with different element types
	stringChanType := reflect.ChanOf(reflect.BothDir, reflect.TypeOf(""))
	stringChan := reflect.MakeChan(stringChanType, 5)
	println("String chan type:", stringChan.Type().String())
	println("String chan elem type:", stringChan.Type().Elem().String())

	// Test buffered vs unbuffered channels
	unbufferedChan := reflect.MakeChan(chanType, 0)
	bufferedChan := reflect.MakeChan(chanType, 10)
	println("Unbuffered chan type:", unbufferedChan.Type().String())
	println("Buffered chan type:", bufferedChan.Type().String())

	// Test channel reflection properties
	println("Chan elem type:", chanType.Elem().String())
	println("Chan elem kind:", chanType.Elem().Kind().String())
	println("Chan size:", chanType.Size())

	// Test Select functionality
	intChan := reflect.MakeChan(reflect.ChanOf(reflect.BothDir, reflect.TypeOf(0)), 1)
	strChan := reflect.MakeChan(reflect.ChanOf(reflect.BothDir, reflect.TypeOf("")), 1)

	// Send values to only the string channel to make select deterministic
	strChan.Send(reflect.ValueOf("hello"))

	cases := []reflect.SelectCase{
		{Dir: reflect.SelectRecv, Chan: intChan},
		{Dir: reflect.SelectRecv, Chan: strChan},
		{Dir: reflect.SelectDefault},
	}
	chosen, recv, recvOK := reflect.Select(cases)
	println("Select chosen:", chosen, "recvOK:", recvOK)
	if recv.IsValid() {
		println("Select recv type:", recv.Type().String())
		// Print the actual received value
		if chosen == 0 {
			println("Select recv value:", recv.Int())
		} else if chosen == 1 {
			println("Select recv value:", recv.String())
		}
	} else {
		println("Select recv type: invalid")
	}
}
