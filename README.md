# GoScript

[![GoDoc Widget]][GoDoc] [![Go Report Card Widget]][Go Report Card] [![DeepWiki Widget]][DeepWiki]

[GoDoc]: https://godoc.org/github.com/aperturerobotics/goscript
[GoDoc Widget]: https://godoc.org/github.com/aperturerobotics/goscript?status.svg
[Go Report Card Widget]: https://goreportcard.com/badge/github.com/aperturerobotics/goscript
[Go Report Card]: https://goreportcard.com/report/github.com/aperturerobotics/goscript
[DeepWiki Widget]: https://img.shields.io/badge/DeepWiki-aperturerobotics%2Fgoscript-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==
[DeepWiki]: https://deepwiki.com/aperturerobotics/goscript

## What is GoScript?

GoScript is a **Go to TypeScript compiler** that translates Go code to TypeScript at the AST level. Perfect for sharing algorithms and business logic between Go backends and TypeScript frontends.

> Right now goscript looks pretty cool if you problem is "I want this self-sufficient algorithm be available in Go and JS runtimes". gopherjs's ambition, however, has always been "any valid Go program can run in a browser". There is a lot that goes on in gopherjs that is necessary for supporting the standard library, which goes beyond cross-language translation.
>
> &mdash; [nevkontakte](https://gophers.slack.com/archives/C039C0R2T/p1745870396945719), developer of [GopherJS](https://github.com/gopherjs/gopherjs)

### 🎯 Why GoScript?

**Write once, run everywhere.** Share your Go algorithms, business logic, and data structures seamlessly between your backend and frontend without maintaining two codebases.

✅ **Perfect for:**
- Sharing business logic between Go services and web apps
- Porting Go algorithms to run in browsers
- Building TypeScript libraries from existing Go code
- Full-stack teams that love Go's simplicity

⚠️ **What's supported:**
GoScript compiles a powerful subset of Go:
- Structs, interfaces, methods, and functions
- Channels and goroutines (translated to async/await)
- Slices, maps, and most built-in types
- Basic reflection support
- Standard control flow (if, for, switch, etc.)

**Current limitations:**
- Uses JavaScript `number` type (64-bit float, not Go's int types)
- No pointer arithmetic (`uintptr`) or `unsafe` package
- No complex numbers
- Limited standard library (growing rapidly)

If you're building algorithms, business logic, or data processing code, GoScript has you covered! 🚀

📖 **Learn more:** [Design document](./design/DESIGN.md) | [Compliance tests](./compliance/COMPLIANCE.md)

## 🚀 Get Started in 2 Minutes

### Installation

**Option 1: Go Install**
```bash
go install github.com/aperturerobotics/goscript/cmd/goscript@latest
```

**Option 2: NPM**
```bash
npm install -g goscript
```

### Your First Compilation

```bash
# Compile your Go package to TypeScript
goscript compile --package . --output ./dist
```

## 💡 See It In Action

### Example: User Management

**Go Code** (`user.go`):
```go
package main

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func (u *User) IsValid() bool {
    return u.Name != "" && u.Email != ""
}

func NewUser(id int, name, email string) *User {
    return &User{ID: id, Name: name, Email: email}
}

func FindUserByEmail(users []*User, email string) *User {
    for _, user := range users {
        if user.Email == email {
            return user
        }
    }
    return nil
}
```

**Compile it:**
```bash
goscript compile --package . --output ./dist
```

**Generated TypeScript** (`user.ts`):
```typescript
export class User {
  public ID: number = 0
  public Name: string = ""
  public Email: string = ""

  public IsValid(): boolean {
    const u = this
    return u.Name !== "" && u.Email !== ""
  }

  constructor(init?: Partial<User>) {
    if (init) Object.assign(this, init)
  }
}

export function NewUser(id: number, name: string, email: string): User {
  return new User({ ID: id, Name: name, Email: email })
}

export function FindUserByEmail(users: User[], email: string): User | null {
  for (let user of users) {
    if (user.Email === email) {
      return user
    }
  }
  return null
}
```

**Use in your frontend:**
```typescript
import { NewUser, FindUserByEmail } from '@goscript/myapp/user'

// Same logic, now in TypeScript!
const users = [
  NewUser(1, "Alice", "alice@example.com"),
  NewUser(2, "Bob", "bob@example.com")
]

const alice = FindUserByEmail(users, "alice@example.com")
console.log(alice?.IsValid()) // true
```

### Example: Async Processing with Channels

**Go Code:**
```go
func ProcessMessages(messages []string) chan string {
    results := make(chan string, len(messages))
    
    for _, msg := range messages {
        go func(m string) {
            // Simulate processing
            processed := "✓ " + m
            results <- processed
        }(msg)
    }
    
    return results
}
```

**Generated TypeScript:**
```typescript
export function ProcessMessages(messages: string[]): $.Channel<string> {
  let results = $.makeChannel<string>(messages.length, "")
  
  for (let msg of messages) {
    queueMicrotask(async (m: string) => {
      let processed = "✓ " + m
      await results.send(processed)
    })(msg)
  }
  
  return results
}
```

**Use with async/await:**
```typescript
import { ProcessMessages } from '@goscript/myapp/processor'

async function handleMessages() {
  const channel = ProcessMessages(["hello", "world", "goscript"])
  
  // Receive processed messages
  for (let i = 0; i < 3; i++) {
    const result = await channel.receive()
    console.log(result) // "✓ hello", "✓ world", "✓ goscript"
  }
}
```

## 🛠️ Integration & Usage

### Command Line

```bash
goscript compile --package ./my-go-code --output ./dist
```

**Options:**
- `--package <path>` - Go package to compile (default: ".")
- `--output <dir>` - Output directory for TypeScript files

### Programmatic API

**Go:**
```go
import "github.com/aperturerobotics/goscript/compiler"

conf := &compiler.Config{OutputPath: "./dist"}
comp, err := compiler.NewCompiler(conf, logger, nil)
_, err = comp.CompilePackages(ctx, "your/package/path")
```

**Node.js:**
```typescript
import { compile } from 'goscript'

await compile({
  pkg: './my-go-package',
  output: './dist'
})
```

### Frontend Frameworks

**React + GoScript:**
```typescript
import { NewCalculator } from '@goscript/myapp/calculator'

function CalculatorApp() {
  const [calc] = useState(() => NewCalculator())
  
  const handleAdd = () => {
    const result = calc.Add(5, 3)
    setResult(result)
  }

  return <button onClick={handleAdd}>Add 5 + 3</button>
}
```

**Vue + GoScript:**
```vue
<script setup lang="ts">
import { NewUser, FindUserByEmail } from '@goscript/myapp/user'

const users = ref([
  NewUser(1, "Alice", "alice@example.com")
])

const searchUser = (email: string) => {
  return FindUserByEmail(users.value, email)
}
</script>
```

## 🚀 What's Next?

**Current Status:**
- ✅ Core language features (structs, methods, interfaces)
- ✅ Async/await for goroutines and channels  
- ✅ Basic reflection support
- ✅ Most control flow and data types

**Coming Soon:**
- 📦 Expanded standard library
- 🧪 Go test → TypeScript test conversion
- ⚡ Performance optimizations
- 🔧 Better tooling integration

Check our [compliance tests](./compliance/COMPLIANCE.md) for detailed progress.

## 🤝 Real-World Use Cases

**Fintech:** Share complex financial calculations between Go services and trading dashboards

**Gaming:** Run the same game logic on servers and in browser clients

**Data Processing:** Use identical algorithms for backend ETL and frontend analytics

**Validation:** Keep business rules consistent across your entire stack

Ready to eliminate code duplication? [Get started now](#-get-started-in-2-minutes) 🚀

## License

MIT
