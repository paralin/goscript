import * as goscript from "@go/builtin";

class MyStruct {
	// MyInt is a public integer field, initialized to zero.
	public MyInt: number = 0;
	// MyString is a public string field, initialized to empty string.
	public MyString: string = "";
	// myBool is a private boolean field, initialized to false.
	private myBool: boolean = false;
	
	// GetMyString returns the MyString field.
	public GetMyString(): string {
		const m = this
		return m.MyString
	}
	
	// GetMyBool returns the myBool field.
	public GetMyBool(): boolean {
		const m = this
		return m.myBool
	}
	
	constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
	public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

// NewMyStruct creates a new MyStruct instance.
export function NewMyStruct(s: string): MyStruct {
	return new MyStruct({ MyString: s })
}

function vals(): [number, number] {
	return [1, 2]
}

export function main(): void {
	console.log("Hello from GoScript example!")
	
	// Basic arithmetic
	let a = 10
	let b = 3
	console.log("Addition:", a + b, "Subtraction:", a - b, "Multiplication:", a * b, "Division:", a / b, "Modulo:", a % b)
	
	// Boolean logic and comparisons
	console.log("Logic &&:", true && false, "||:", true || false, "!:!", !true)
	console.log("Comparisons:", a == b, a != b, a < b, a > b, a <= b, a >= b)
	
	// string(rune) conversion
	let r: number = 'X';
	let s = String.fromCharCode(r)
	console.log("string('X'):", s)
	
	// 'y'
	let r2: number = 121;
	let s2 = String.fromCharCode(r2)
	console.log("string(121):", s2)
	
	// '√'
	let r3: number = 0x221A;
	let s3 = String.fromCharCode(r3)
	console.log("string(0x221A):", s3)
	
	// Arrays
	let arr = [1, 2, 3]
	console.log("Array elements:", arr[0], arr[1], arr[2])
	
	// Slices and range loop
	let slice = [4, 5, 6]
	console.log("Slice elements:", slice[0], slice[1], slice[2])
	let sum = 0
	for (let idx = 0; idx < slice.length; idx++) {
		const val = slice[idx]
		{
			sum += val
			console.log("Range idx:", idx, "val:", val)
		}
	}
	console.log("Range sum:", sum)
	
	// Basic for loop
	let prod = 1
	for (let i = 1; i <= 3; i++) {
		prod *= i
	}
	console.log("Product via for:", prod)
	
	// Struct, pointers, copy independence
	let instance = NewMyStruct("go-script").clone()
	console.log("instance.MyString:", instance.GetMyString())
	instance.MyInt = 42
	let copyInst = instance.clone()
	copyInst.MyInt = 7
	console.log("instance.MyInt:", instance.MyInt, "copyInst.MyInt:", copyInst.MyInt)
	
	// Pointer initialization and dereference assignment
	let ptr = new(MyStruct)
	ptr.MyInt = 9
	console.log("ptr.MyInt:", ptr.MyInt)
	let deref = ptr.clone()
	deref.MyInt = 8
	console.log("After deref assign, ptr.MyInt:", ptr.MyInt, "deref.MyInt:", deref.MyInt)
	
	// Method calls on pointer receiver
	ptr.myBool = true
	console.log("ptr.GetMyBool():", ptr.GetMyBool())
	
	// Composite literal assignment
	let comp = new MyStruct({ MyInt: 100, MyString: "composite", myBool: false }).clone()
	console.log("comp fields:", comp.MyInt, comp.GetMyString(), comp.GetMyBool())
	
	// Multiple return values and blank identifier
	let [x, ] = vals()
	let [, y] = vals()
	console.log("vals x:", x, "y:", y)
	
	// If/else
	if (a > b) {
		console.log("If branch: a>b")
	} else {
		console.log("Else branch: a<=b")
	}
	
	// Switch statement
	switch (a) {
		case 10:
			console.log("Switch case 10")
			break
		default:
			console.log("Switch default")
			break
	}
}

