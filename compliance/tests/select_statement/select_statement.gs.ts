// Generated file based on select_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	// Test 1: Simple deterministic select with default
	// Create a buffered channel so sends don't block
	let ch1 = goscript.makeChannel<string>(1, "")
	
	// First test: empty channel, should hit default
	const _tempVar1: goscript.SelectCase<any>[] = []
	_tempVar1.push({
		id: 0,
		isSend: false,
		channel: ch1,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST1: Received unexpected value:", msg)
		}
	}),
	
	_tempVar1.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST1: Default case hit correctly")
		}
	}),
	
	await goscript.selectStatement(_tempVar1, true)
	
	// Now put something in the channel
	await ch1.send("hello")
	
	// Second test: should read from channel
	const _tempVar2: goscript.SelectCase<any>[] = []
	_tempVar2.push({
		id: 0,
		isSend: false,
		channel: ch1,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST2: Received expected value:", msg)
		}
	}),
	
	_tempVar2.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST2: Default case hit unexpectedly")
		}
	}),
	
	await goscript.selectStatement(_tempVar2, true)
	
	// Test 3: Select with channel closing and ok value
	let ch2 = goscript.makeChannel<number>(1, 0)
	await ch2.send(42)
	ch2.close()
	
	// First receive gets the buffered value
	const _tempVar3: goscript.SelectCase<any>[] = []
	_tempVar3.push({
		id: 0,
		isSend: false,
		channel: ch2,
		onSelected: async (result) => {
			const val = result.value
			const ok = result.ok
			if (ok) {
				console.log("TEST3: Received buffered value with ok==true:", val)
			} else {
				console.log("TEST3: Unexpected ok==false")
			}
		}
	}),
	
	_tempVar3.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST3: Default hit unexpectedly")
		}
	}),
	
	await goscript.selectStatement(_tempVar3, true)
	
	// Second receive gets the zero value with ok==false
	const _tempVar4: goscript.SelectCase<any>[] = []
	_tempVar4.push({
		id: 0,
		isSend: false,
		channel: ch2,
		onSelected: async (result) => {
			const val = result.value
			const ok = result.ok
			if (ok) {
				console.log("TEST4: Unexpected ok==true:", val)
			} else {
				console.log("TEST4: Received zero value with ok==false:", val)
			}
		}
	}),
	
	_tempVar4.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST4: Default hit unexpectedly")
		}
	}),
	
	await goscript.selectStatement(_tempVar4, true)
	
	// Test 5: Send operations
	let ch3 = goscript.makeChannel<number>(1, 0)
	
	// First send should succeed (buffer not full)
	const _tempVar5: goscript.SelectCase<any>[] = []
	_tempVar5.push({
		id: 0,
		isSend: true,
		channel: ch3,
		value: 5,
		onSelected: async (result) => {
			console.log("TEST5: Sent value successfully")
		}
	}),
	
	_tempVar5.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST5: Default hit unexpectedly")
		}
	}),
	
	await goscript.selectStatement(_tempVar5, true)
	
	// Second send should hit default (buffer full)
	const _tempVar6: goscript.SelectCase<any>[] = []
	_tempVar6.push({
		id: 0,
		isSend: true,
		channel: ch3,
		value: 10,
		onSelected: async (result) => {
			console.log("TEST6: Sent unexpectedly")
		}
	}),
	
	_tempVar6.push({
		id: -1,
		isSend: false,
		channel: null,
		onSelected: async (result) => {
			console.log("TEST6: Default hit correctly (channel full)")
		}
	}),
	
	await goscript.selectStatement(_tempVar6, true)
	
	// Test 7: Multiple channel select (with known values)
	let ch4 = goscript.makeChannel<string>(1, "")
	let ch5 = goscript.makeChannel<string>(1, "")
	
	await ch4.send("from ch4")
	
	// Should select ch4 because it has data, ch5 is empty
	const _tempVar7: goscript.SelectCase<any>[] = []
	_tempVar7.push({
		id: 0,
		isSend: false,
		channel: ch4,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST7: Selected ch4 correctly:", msg)
		}
	}),
	
	_tempVar7.push({
		id: 1,
		isSend: false,
		channel: ch5,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST7: Selected ch5 unexpectedly:", msg)
		}
	}),
	
	await goscript.selectStatement(_tempVar7, false)
	
	// Now ch4 is empty and ch5 is empty
	await ch5.send("from ch5")
	
	// Should select ch5 because it has data, ch4 is empty
	const _tempVar8: goscript.SelectCase<any>[] = []
	_tempVar8.push({
		id: 0,
		isSend: false,
		channel: ch4,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST8: Selected ch4 unexpectedly:", msg)
		}
	}),
	
	_tempVar8.push({
		id: 1,
		isSend: false,
		channel: ch5,
		onSelected: async (result) => {
			const msg = result.value
			console.log("TEST8: Selected ch5 correctly:", msg)
		}
	}),
	
	await goscript.selectStatement(_tempVar8, false)
	
	// Test 9: Channel closing test case for a separate test
	let chClose = goscript.makeChannel<boolean>(0, false)
	chClose.close()
	const _tempVar9 = await chClose.receiveWithOk()
	let val = _tempVar9.value
	let ok = _tempVar9.ok
	if (!ok) {
		console.log("TEST9: Channel is closed, ok is false, val:", val)
	} else {
		console.log("TEST9: Channel reports as not closed")
	}
}

