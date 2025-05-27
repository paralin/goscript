import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";
import { File } from "./types_js.gs.js";

// JavaScript-specific stub for raw connection operations
// These operations are not available in JavaScript environments

export class rawConn {
	constructor(private file: File | null) {}

	// Control calls fn with the file descriptor - stub implementation
	public Control(f: ((fd: number) => void) | null): $.GoError {
		return ErrUnimplemented
	}

	// Read calls fn when the file descriptor is ready for reading - stub implementation  
	public Read(f: ((fd: number) => boolean) | null): $.GoError {
		return ErrUnimplemented
	}

	// Write calls fn when the file descriptor is ready for writing - stub implementation
	public Write(f: ((fd: number) => boolean) | null): $.GoError {
		return ErrUnimplemented
	}
}

// newRawConn creates a new raw connection - stub implementation
export function newRawConn(file: File | null): rawConn {
	return new rawConn(file)
} 