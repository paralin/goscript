package main

// Test case that replicates the buffer value field error
// The issue: b!.value = $.append(b!.value, c) should be this._value = $.append(this._value, c)

type buffer struct {
	data []byte
}

func (b *buffer) write(p []byte) {
	// This should generate: this._value = $.append(this._value, p)
	// But incorrectly generates: b!.value = $.append(b!.value, p)
	b.data = append(b.data, p...)
}

func (b *buffer) writeString(s string) {
	// This should generate: this._value = $.append(this._value, s)
	// But incorrectly generates: b!.value = $.append(b!.value, s)
	b.data = append(b.data, s...)
}

func (b *buffer) writeByte(c byte) {
	// This should generate: this._value = $.append(this._value, c)
	// But incorrectly generates: b!.value = $.append(b!.value, c)
	b.data = append(b.data, c)
}

func main() {
	buf := &buffer{}

	// Test write
	buf.write([]byte("hello"))
	println("After write:", string(buf.data))

	// Test writeString
	buf.writeString(" world")
	println("After writeString:", string(buf.data))

	// Test writeByte
	buf.writeByte('!')
	println("After writeByte:", string(buf.data))
}
