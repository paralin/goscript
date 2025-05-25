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

	jdata, err := msg.MarshalJSON()
	if err != nil {
		println("error marshalling to json:", err.Error())
		return
	}

	println("json marshaled:", string(jdata))

	out = &ExampleMsg{}
	err2 := out.UnmarshalJSON(jdata)
	if err2 != nil {
		println("error unmarshalling from json:", err.Error())
		return
	}

	println("json unmarshaled:", out)
}
