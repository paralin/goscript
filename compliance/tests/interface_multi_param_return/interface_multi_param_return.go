package main

type MultiParamReturner interface {
	Process(data []byte, count int, _ string) (bool, error)
}

type MyProcessor struct{}

func (p MyProcessor) Process(data []byte, count int, _ string) (bool, error) {
	// Dummy implementation
	if count > 0 && len(data) > 0 {
		println("Processing successful")
		return true, nil // Use nil for error type
	}
	println("Processing failed")
	return false, nil // Use nil for error type
}

func main() {
	var processor MultiParamReturner
	processor = MyProcessor{}

	data := []byte{1, 2, 3}
	success, _ := processor.Process(data, 5, "unused")

	if success {
		println("Main: Success reported")
	} else {
		println("Main: Failure reported")
	}
}
