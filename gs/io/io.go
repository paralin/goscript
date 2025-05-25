package io

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for io package functions
// This defines which functions/methods are async for the compiler analysis

// Most io operations are synchronous in our implementation
// since we're dealing with in-memory operations and simple transformations

// Copy functions - these could potentially be async if dealing with large data
// but for simplicity, we'll keep them sync for now
var (
	CopyInfo       = compiler.FunctionInfo{IsAsync: false}
	CopyBufferInfo = compiler.FunctionInfo{IsAsync: false}
	CopyNInfo      = compiler.FunctionInfo{IsAsync: false}
)

// Read functions - sync since they're immediate operations
var (
	ReadAllInfo     = compiler.FunctionInfo{IsAsync: false}
	ReadAtLeastInfo = compiler.FunctionInfo{IsAsync: false}
	ReadFullInfo    = compiler.FunctionInfo{IsAsync: false}
)

// Write functions - sync
var WriteStringInfo = compiler.FunctionInfo{IsAsync: false}

// Utility functions - sync
var (
	LimitReaderInfo      = compiler.FunctionInfo{IsAsync: false}
	MultiReaderInfo      = compiler.FunctionInfo{IsAsync: false}
	MultiWriterInfo      = compiler.FunctionInfo{IsAsync: false}
	TeeReaderInfo        = compiler.FunctionInfo{IsAsync: false}
	NopCloserInfo        = compiler.FunctionInfo{IsAsync: false}
	NewSectionReaderInfo = compiler.FunctionInfo{IsAsync: false}
	NewOffsetWriterInfo  = compiler.FunctionInfo{IsAsync: false}
)

// Interface methods - sync for basic operations
// Reader methods
var ReaderReadInfo = compiler.FunctionInfo{IsAsync: false}

// Writer methods
var WriterWriteInfo = compiler.FunctionInfo{IsAsync: false}

// Closer methods
var CloserCloseInfo = compiler.FunctionInfo{IsAsync: false}

// Seeker methods
var SeekerSeekInfo = compiler.FunctionInfo{IsAsync: false}

// ReaderAt methods
var ReaderAtReadAtInfo = compiler.FunctionInfo{IsAsync: false}

// WriterAt methods
var WriterAtWriteAtInfo = compiler.FunctionInfo{IsAsync: false}

// LimitedReader methods
var LimitedReaderReadInfo = compiler.FunctionInfo{IsAsync: false}

// SectionReader methods
var (
	SectionReaderReadInfo   = compiler.FunctionInfo{IsAsync: false}
	SectionReaderSeekInfo   = compiler.FunctionInfo{IsAsync: false}
	SectionReaderReadAtInfo = compiler.FunctionInfo{IsAsync: false}
	SectionReaderSizeInfo   = compiler.FunctionInfo{IsAsync: false}
)

// OffsetWriter methods
var (
	OffsetWriterWriteInfo   = compiler.FunctionInfo{IsAsync: false}
	OffsetWriterWriteAtInfo = compiler.FunctionInfo{IsAsync: false}
	OffsetWriterSeekInfo    = compiler.FunctionInfo{IsAsync: false}
)
