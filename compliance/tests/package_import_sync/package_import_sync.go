package main

import "sync"

func main() {
	// Test Mutex
	var mu sync.Mutex
	mu.Lock()
	println("Mutex locked")
	mu.Unlock()
	println("Mutex unlocked")

	// Test TryLock
	if mu.TryLock() {
		println("TryLock succeeded")
		mu.Unlock()
	} else {
		println("TryLock failed")
	}

	// Test WaitGroup
	var wg sync.WaitGroup
	wg.Add(1)
	println("WaitGroup counter set to 1")
	wg.Done()
	println("WaitGroup counter decremented")
	wg.Wait()
	println("WaitGroup wait completed")

	// Test Once
	var once sync.Once
	counter := 0
	once.Do(func() {
		counter++
		println("Once function executed, counter:", counter)
	})
	once.Do(func() {
		counter++
		println("This should not execute")
	})
	println("Final counter:", counter)

	// Test OnceFunc
	onceFunc := sync.OnceFunc(func() {
		println("OnceFunc executed")
	})
	onceFunc()
	onceFunc() // Should not execute again

	// Test OnceValue
	onceValue := sync.OnceValue(func() int {
		println("OnceValue function executed")
		return 42
	})
	val1 := onceValue()
	val2 := onceValue()
	println("OnceValue results:", val1, val2)

	// Test sync.Map
	var m sync.Map
	m.Store("key1", "value1")
	println("Stored key1")

	if val, ok := m.Load("key1"); ok {
		println("Loaded key1:", val)
	}

	if val, loaded := m.LoadOrStore("key2", "value2"); !loaded {
		println("Stored key2:", val)
	}

	m.Range(func(key, value interface{}) bool {
		println("Range:", key, "->", value)
		return true
	})

	m.Delete("key1")
	if _, ok := m.Load("key1"); !ok {
		println("key1 deleted successfully")
	}

	// Test Pool
	pool := &sync.Pool{
		New: func() interface{} {
			println("Pool creating new object")
			return "new object"
		},
	}

	obj1 := pool.Get()
	println("Got from pool:", obj1)
	pool.Put("reused object")
	obj2 := pool.Get()
	println("Got from pool:", obj2)

	println("test finished")
}
