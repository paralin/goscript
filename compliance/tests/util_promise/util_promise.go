package main

import "context"

// Promise is an asynchronous result to an operation
type Promise[T any] struct {
	result     T
	err        error
	isResolved bool
	ch         chan struct{}
}

// NewPromise constructs a new empty Promise
func NewPromise[T any]() *Promise[T] {
	return &Promise[T]{
		ch: make(chan struct{}),
	}
}

// NewPromiseWithResult constructs a promise pre-resolved with a result
func NewPromiseWithResult[T any](val T, err error) *Promise[T] {
	p := &Promise[T]{
		result:     val,
		err:        err,
		isResolved: true,
		ch:         make(chan struct{}),
	}
	if p.ch != nil {
		close(p.ch)
	}
	return p
}

// SetResult sets the result of the promise
func (p *Promise[T]) SetResult(val T, err error) bool {
	if p.isResolved {
		return false
	}
	p.result = val
	p.err = err
	p.isResolved = true
	if p.ch != nil {
		close(p.ch)
	}
	return true
}

// Await waits for the result to be set or for ctx to be canceled
func (p *Promise[T]) Await(ctx context.Context) (val T, err error) {
	if p.isResolved {
		return p.result, p.err
	}

	select {
	case <-p.ch:
		return p.result, p.err
	case <-ctx.Done():
		var zero T
		return zero, ctx.Err()
	}
}

func main() {
	ctx := context.Background()

	// Test 1: Basic Promise with string
	println("Test 1: Basic Promise with string")
	p1 := NewPromise[string]()

	// Set result in goroutine
	go func() {
		p1.SetResult("hello world", nil)
	}()

	result1, err1 := p1.Await(ctx)
	if err1 != nil {
		println("Error:", err1.Error())
	} else {
		println("Result:", result1)
	}

	// Test 2: Pre-resolved Promise with int
	println("Test 2: Pre-resolved Promise with int")
	p2 := NewPromiseWithResult[int](42, nil)
	result2, err2 := p2.Await(ctx)
	if err2 != nil {
		println("Error:", err2.Error())
	} else {
		println("Result:", result2)
	}

	// Test 3: Promise with error
	println("Test 3: Promise with error")
	p3 := NewPromiseWithResult[bool](false, context.DeadlineExceeded)
	result3, err3 := p3.Await(ctx)
	if err3 != nil {
		println("Error:", err3.Error())
	} else {
		println("Result:", result3)
	}

	// Test 4: Cannot set result twice
	println("Test 4: Cannot set result twice")
	p4 := NewPromise[int]()
	success1 := p4.SetResult(100, nil)
	success2 := p4.SetResult(200, nil)
	println("First set success:", success1)
	println("Second set success:", success2)

	result4, err4 := p4.Await(ctx)
	if err4 != nil {
		println("Error:", err4.Error())
	} else {
		println("Final result:", result4)
	}

	println("All tests completed")
}
