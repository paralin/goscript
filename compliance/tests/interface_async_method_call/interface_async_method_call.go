package main

// Interface with a method that will be async due to implementation
type AsyncProcessor interface {
	Process(data int) int
	GetResult() int
}

// Implementation that uses channels, making Process async
type ChannelProcessor struct {
	ch chan int
}

func (p *ChannelProcessor) Process(data int) int {
	// Channel operation makes this function async
	p.ch <- data
	result := <-p.ch
	return result * 2
}

func (p *ChannelProcessor) GetResult() int {
	// This method is sync
	return 42
}

// Implementation that's naturally sync but must be async-compatible
type SimpleProcessor struct {
	value int
}

func (p *SimpleProcessor) Process(data int) int {
	// Simple operation, but must be async due to interface constraint
	return data + 10
}

func (p *SimpleProcessor) GetResult() int {
	return p.value
}

// Function that calls async method on interface
func processViaInterface(processor AsyncProcessor, input int) int {
	// This call should be awaited in TypeScript since Process is async
	result := processor.Process(input)

	// This call should NOT be awaited since GetResult is sync
	baseResult := processor.GetResult()

	return result + baseResult
}

func main() {
	// Create a buffered channel
	ch := make(chan int, 1)

	// Test with ChannelProcessor (naturally async)
	channelProc := &ChannelProcessor{ch: ch}
	result1 := processViaInterface(channelProc, 5)
	println("ChannelProcessor result:", result1) // Expected: 52 (5*2 + 42)

	// Test with SimpleProcessor (forced async for compatibility)
	simpleProc := &SimpleProcessor{value: 100}
	result2 := processViaInterface(simpleProc, 5)
	println("SimpleProcessor result:", result2) // Expected: 115 (5+10 + 100)

	close(ch)
}
