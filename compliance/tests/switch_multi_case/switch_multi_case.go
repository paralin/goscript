package main

func main() {
	stdNumMonth := 1
	stdZeroMonth := 2
	// stdLongMonth := 3 // Not used in this specific example but good for context

	month := 0
	value := "someValue"
	var err error

	getnum := func(v string, flag bool) (int, string, error) {
		if flag {
			return 12, v + "_processed_flag_true", nil
		}
		return 1, v + "_processed_flag_false", nil
	}

	std := 2

	switch std {
	case stdNumMonth, stdZeroMonth:
		month, value, err = getnum(value, std == stdZeroMonth)
		if err != nil {
			println("Error:", err.Error())
		}
		println("Month:", month, "Value:", value)
	case 3:
		println("Std is 3")
	default:
		println("Default case")
	}

	std = 1
	switch std {
	case stdNumMonth, stdZeroMonth:
		month, value, err = getnum(value, std == stdZeroMonth)
		if err != nil {
			println("Error:", err.Error())
		}
		println("Month:", month, "Value:", value)
	case 3:
		println("Std is 3")
	default:
		println("Default case")
	}
}
