package main

type ByteSize int

const (
	_           = iota // ignore first value by assigning to blank identifier
	KB ByteSize = 1 << (10 * iota)
	MB
	GB
	TB
)

type Direction int

const (
	North Direction = iota
	East
	South
	West
)

const (
	Red = iota
	Green
	Blue
)

const (
	Sunday = iota
	Monday
	Tuesday
	Wednesday
	Thursday
	Friday
	Saturday
)

const (
	First  = iota + 1
	Second = iota + 1
	Third  = iota + 1
)

const (
	A = iota * 2
	B
	C
)

func main() {
	println("ByteSize constants:")
	println("KB:", int(KB))
	println("MB:", int(MB))
	println("GB:", int(GB))
	println("TB:", int(TB))

	println("Direction constants:")
	println("North:", int(North))
	println("East:", int(East))
	println("South:", int(South))
	println("West:", int(West))

	println("Color constants:")
	println("Red:", Red)
	println("Green:", Green)
	println("Blue:", Blue)

	println("Day constants:")
	println("Sunday:", Sunday)
	println("Monday:", Monday)
	println("Tuesday:", Tuesday)
	println("Wednesday:", Wednesday)
	println("Thursday:", Thursday)
	println("Friday:", Friday)
	println("Saturday:", Saturday)

	println("Arithmetic constants:")
	println("First:", First)
	println("Second:", Second)
	println("Third:", Third)

	println("Multiplication constants:")
	println("A:", A)
	println("B:", B)
	println("C:", C)
}
