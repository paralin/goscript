package io

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for io package functions
// This defines which functions/methods are async for the compiler analysis

// Most io operations are synchronous in our implementation
// since we're dealing with in-memory operations and simple transformations

// Copy functions - these could potentially be async if dealing with large data
// but for simplicity, we'll keep them sync for now
var CopyInfo = compiler.FunctionInfo{IsAsync: false}
var CopyBufferInfo = compiler.FunctionInfo{IsAsync: false}
var CopyNInfo = compiler.FunctionInfo{IsAsync: false}

// Read functions - sync since they're immediate operations
var ReadAllInfo = compiler.FunctionInfo{IsAsync: false}
var ReadAtLeastInfo = compiler.FunctionInfo{IsAsync: false}
var ReadFullInfo = compiler.FunctionInfo{IsAsync: false}

// Write functions - sync
var WriteStringInfo = compiler.FunctionInfo{IsAsync: false}

// Utility functions - sync
var LimitReaderInfo = compiler.FunctionInfo{IsAsync: false}
var MultiReaderInfo = compiler.FunctionInfo{IsAsync: false}
var MultiWriterInfo = compiler.FunctionInfo{IsAsync: false}
var TeeReaderInfo = compiler.FunctionInfo{IsAsync: false}
var NopCloserInfo = compiler.FunctionInfo{IsAsync: false}
var NewSectionReaderInfo = compiler.FunctionInfo{IsAsync: false}
var NewOffsetWriterInfo = compiler.FunctionInfo{IsAsync: false}

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
var SectionReaderReadInfo = compiler.FunctionInfo{IsAsync: false}
var SectionReaderSeekInfo = compiler.FunctionInfo{IsAsync: false}
var SectionReaderReadAtInfo = compiler.FunctionInfo{IsAsync: false}
var SectionReaderSizeInfo = compiler.FunctionInfo{IsAsync: false}

// OffsetWriter methods
var OffsetWriterWriteInfo = compiler.FunctionInfo{IsAsync: false}
var OffsetWriterWriteAtInfo = compiler.FunctionInfo{IsAsync: false}
var OffsetWriterSeekInfo = compiler.FunctionInfo{IsAsync: false}
