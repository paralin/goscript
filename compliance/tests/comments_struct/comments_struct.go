package main

// TestStruct is a struct with commented fields.
type TestStruct struct {
	// IntField is a commented integer field.
	IntField int
	// StringField is a commented string field.
	StringField string
}

func main() {
	s := TestStruct{
		IntField:    42,
		StringField: "hello",
	}
	println("IntField:", s.IntField)
	println("StringField:", s.StringField)
}
