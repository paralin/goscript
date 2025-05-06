package main

func main() {
	// Create map using make
	scores := make(map[string]int)
	println("Empty map created: Expected: true, Actual:", len(scores) == 0)

	// Add key-value pairs
	scores["Alice"] = 90
	scores["Bob"] = 85
	scores["Charlie"] = 92

	// Map size
	println("Map size after adding 3 items: Expected: 3, Actual:", len(scores))

	// Access values
	println("Alice's score: Expected: 90, Actual:", scores["Alice"])
	println("Bob's score: Expected: 85, Actual:", scores["Bob"])

	// Modify a value
	scores["Bob"] = 88
	println("Bob's updated score: Expected: 88, Actual:", scores["Bob"])

	// Check if key exists (comma-ok idiom)
	value, exists := scores["David"]
	println("Does David exist in map? Expected: false, Actual:", exists)
	println("Value for non-existent key: Expected: 0, Actual:", value)

	// Delete a key
	delete(scores, "Charlie")
	_, exists = scores["Charlie"]
	println("After delete, does Charlie exist? Expected: false, Actual:", exists)

	// Create map with literal syntax
	colors := map[string]string{
		"red":   "#ff0000",
		"green": "#00ff00",
		"blue":  "#0000ff",
	}
	println("Map literal size: Expected: 3, Actual:", len(colors))
	println("Color code for red: Expected: #ff0000, Actual:", colors["red"])

	// Iterate over a map with range
	println("Iterating over scores map:")

	// Create a new map with string keys and string values for testing iteration
	stringMap := map[string]string{
		"Alice":   "A+",
		"Bob":     "B+",
		"Charlie": "A",
	}

	// Note: Map iteration is not ordered in Go, so we will collect the results and sort them for consistent test output.
	var scoreResults []string
	for name, grade := range stringMap {
		// Using string concatenation to build the output string
		result := "  - Name: " + name + " Grade: " + grade
		scoreResults = append(scoreResults, result)
	}

	// Inline bubble sort for string slice
	// (avoid importing sort package yet)
	n := len(scoreResults)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if scoreResults[j] > scoreResults[j+1] {
				scoreResults[j], scoreResults[j+1] = scoreResults[j+1], scoreResults[j]
			}
		}
	}

	for _, result := range scoreResults {
		println(result)
	}
}
