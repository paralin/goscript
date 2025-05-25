package main

func main() {
	msg := &ExampleMsg{
		ExampleField: []byte("hello"),
		ExampleText:  "world",
	}

	data, err := msg.MarshalVT()
	if err != nil {
		println("error marshalling:", err.Error())
		return
	}

	println("data:", data)

	out := &ExampleMsg{}
	err = out.UnmarshalVT(data)
	if err != nil {
		println("error unmarshalling:", err.Error())
		return
	}

	println("out:", out)
}
