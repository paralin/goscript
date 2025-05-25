package sync

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for sync package functions
// This defines which functions/methods are async for the compiler analysis

// Mutex methods
var (
	MutexLockInfo    = compiler.FunctionInfo{IsAsync: true}
	MutexUnlockInfo  = compiler.FunctionInfo{IsAsync: false}
	MutexTryLockInfo = compiler.FunctionInfo{IsAsync: false}
)

// RWMutex methods
var (
	RWMutexLockInfo     = compiler.FunctionInfo{IsAsync: true}
	RWMutexUnlockInfo   = compiler.FunctionInfo{IsAsync: false}
	RWMutexTryLockInfo  = compiler.FunctionInfo{IsAsync: false}
	RWMutexRLockInfo    = compiler.FunctionInfo{IsAsync: true}
	RWMutexRUnlockInfo  = compiler.FunctionInfo{IsAsync: false}
	RWMutexTryRLockInfo = compiler.FunctionInfo{IsAsync: false}
)

// WaitGroup methods
var (
	WaitGroupAddInfo  = compiler.FunctionInfo{IsAsync: false}
	WaitGroupDoneInfo = compiler.FunctionInfo{IsAsync: false}
	WaitGroupWaitInfo = compiler.FunctionInfo{IsAsync: true}
)

// Once methods
var OnceDoInfo = compiler.FunctionInfo{IsAsync: true}

// Cond methods
var (
	CondBroadcastInfo = compiler.FunctionInfo{IsAsync: false}
	CondSignalInfo    = compiler.FunctionInfo{IsAsync: false}
	CondWaitInfo      = compiler.FunctionInfo{IsAsync: true}
)

// Map methods
var (
	MapDeleteInfo        = compiler.FunctionInfo{IsAsync: true}
	MapLoadInfo          = compiler.FunctionInfo{IsAsync: true}
	MapLoadAndDeleteInfo = compiler.FunctionInfo{IsAsync: true}
	MapLoadOrStoreInfo   = compiler.FunctionInfo{IsAsync: true}
	MapRangeInfo         = compiler.FunctionInfo{IsAsync: true}
	MapStoreInfo         = compiler.FunctionInfo{IsAsync: true}
)

// Pool methods
var (
	PoolGetInfo = compiler.FunctionInfo{IsAsync: false}
	PoolPutInfo = compiler.FunctionInfo{IsAsync: false}
)

// Functions
var (
	OnceFuncInfo   = compiler.FunctionInfo{IsAsync: false}
	OnceValueInfo  = compiler.FunctionInfo{IsAsync: false}
	OnceValuesInfo = compiler.FunctionInfo{IsAsync: false}
	NewCondInfo    = compiler.FunctionInfo{IsAsync: false}
)
