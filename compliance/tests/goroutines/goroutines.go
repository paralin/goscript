// Package main tests goroutine handling with named functions
package main

// Message struct with priority and text for deterministic ordering
type Message struct {
	priority int
	text     string
}

// Channel to collect messages from all goroutines
var messages = make(chan Message)

// Counter to track how many goroutines are running
var doneCount = 0

// Total number of messages we expect to receive
const totalMessages = 8

// A worker function that will be called as a goroutine
func worker(id int) {
	// Send worker starting message
	messages <- Message{
		priority: 10 + id,
		text:     "Worker " + string(rune('0'+id)) + " starting",
	}

	// Send worker done message
	messages <- Message{
		priority: 20 + id,
		text:     "Worker " + string(rune('0'+id)) + " done",
	}
}

// Another worker function to test multiple different goroutines
func anotherWorker(name string) {
	messages <- Message{
		priority: 40,
		text:     "Another worker: " + name,
	}
}

func main() {
	// Create a slice to collect all messages
	allMessages := make([]Message, 0, totalMessages+3) // +3 for main thread messages

	// Add initial message
	allMessages = append(allMessages, Message{
		priority: 0,
		text:     "Main: Starting workers",
	})

	// Start 3 worker goroutines
	for i := 0; i < 3; i++ {
		go worker(i) // This will trigger a past error with *ast.Ident
	}

	// Start another worker goroutine
	go anotherWorker("test")

	// Start an anonymous function worker
	go func() {
		messages <- Message{
			priority: 50,
			text:     "Anonymous function worker",
		}
	}()

	// Add status message
	allMessages = append(allMessages, Message{
		priority: 1,
		text:     "Main: Workers started",
	})

	// Collect all messages from goroutines
	for i := 0; i < totalMessages; i++ {
		allMessages = append(allMessages, <-messages)
	}

	// Add final message
	allMessages = append(allMessages, Message{
		priority: 100,
		text:     "Main: All workers completed",
	})

	// Sort messages by priority for deterministic order
	for i := 0; i < len(allMessages); i++ {
		for j := i + 1; j < len(allMessages); j++ {
			if allMessages[i].priority > allMessages[j].priority {
				allMessages[i], allMessages[j] = allMessages[j], allMessages[i]
			}
		}
	}

	// Print all messages in deterministic order
	for _, msg := range allMessages {
		println(msg.priority, msg.text)
	}
	println("done")
}
