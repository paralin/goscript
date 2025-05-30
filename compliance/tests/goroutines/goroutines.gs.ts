// Generated file based on goroutines.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class Message extends $.GoStruct<{priority: number; text: string}> {

	constructor(init?: Partial<{priority?: number, text?: string}>) {
		super({
			priority: { type: Number, default: 0 },
			text: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Message',
	  new Message(),
	  [],
	  Message,
	  {"priority": { kind: $.TypeKind.Basic, name: "number" }, "text": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

let messages: $.Channel<Message> | null = $.makeChannel<Message>(0, new Message(), 'both')

let totalMessages: number = 8

// A worker function that will be called as a goroutine
export async function worker(id: number): Promise<void> {
	// Send worker starting message
	await $.chanSend(messages, new Message({priority: 10 + id, text: "Worker " + $.runeOrStringToString(48 + id) + " starting"}))

	// Send worker done message
	await $.chanSend(messages, new Message({priority: 20 + id, text: "Worker " + $.runeOrStringToString(48 + id) + " done"}))
}

// Another worker function to test multiple different goroutines
export async function anotherWorker(name: string): Promise<void> {
	await $.chanSend(messages, new Message({priority: 40, text: "Another worker: " + name}))
}

export async function main(): Promise<void> {
	// Create a slice to collect all messages
	let allMessages = $.makeSlice<Message>(0, 8 + 3) // +3 for main thread messages

	// Add initial message
	allMessages = $.append(allMessages, new Message({priority: 0, text: "Main: Starting workers"}))

	// Start 3 worker goroutines

	// This will trigger a past error with *ast.Ident
	for (let i = 0; i < 3; i++) {{
		queueMicrotask(async () => {
			await worker(i)
		})
	}
}

// Start another worker goroutine
queueMicrotask(async () => {
	await anotherWorker("test")
})

// Start an anonymous function worker
queueMicrotask(async () => {
	await $.chanSend(messages, new Message({priority: 50, text: "Anonymous function worker"}))
})

// Add status message
allMessages = $.append(allMessages, new Message({priority: 1, text: "Main: Workers started"}))

// Collect all messages from goroutines
for (let i = 0; i < 8; i++) {
	allMessages = $.append(allMessages, await $.chanRecv(messages))
}

// Add final message
allMessages = $.append(allMessages, new Message({priority: 100, text: "Main: All workers completed"}))

// Sort messages by priority for deterministic order
for (let i = 0; i < $.len(allMessages); i++) {
	{
		for (let j = i + 1; j < $.len(allMessages); j++) {
			if (allMessages![i].priority > allMessages![j].priority) {
				;[allMessages![i], allMessages![j]] = [allMessages![j], allMessages![i]]
			}
		}
	}
}

// Print all messages in deterministic order
for (let _i = 0; _i < $.len(allMessages); _i++) {
	const msg = allMessages![_i]
	{
		console.log(msg.priority, msg.text)
	}
}
console.log("done")
}

