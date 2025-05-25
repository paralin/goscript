package sync

import "github.com/aperturerobotics/goscript/compiler"

// Metadata for sync package functions
// This defines which functions/methods are async for the compiler analysis

// Mutex methods
var MutexLockInfo = compiler.FunctionInfo{IsAsync: true}
var MutexUnlockInfo = compiler.FunctionInfo{IsAsync: false}
var MutexTryLockInfo = compiler.FunctionInfo{IsAsync: false}

// RWMutex methods
var RWMutexLockInfo = compiler.FunctionInfo{IsAsync: true}
var RWMutexUnlockInfo = compiler.FunctionInfo{IsAsync: false}
var RWMutexTryLockInfo = compiler.FunctionInfo{IsAsync: false}
var RWMutexRLockInfo = compiler.FunctionInfo{IsAsync: true}
var RWMutexRUnlockInfo = compiler.FunctionInfo{IsAsync: false}
var RWMutexTryRLockInfo = compiler.FunctionInfo{IsAsync: false}

// WaitGroup methods
var WaitGroupAddInfo = compiler.FunctionInfo{IsAsync: false}
var WaitGroupDoneInfo = compiler.FunctionInfo{IsAsync: false}
var WaitGroupWaitInfo = compiler.FunctionInfo{IsAsync: true}

// Once methods
var OnceDoInfo = compiler.FunctionInfo{IsAsync: true}

// Cond methods
var CondBroadcastInfo = compiler.FunctionInfo{IsAsync: false}
var CondSignalInfo = compiler.FunctionInfo{IsAsync: false}
var CondWaitInfo = compiler.FunctionInfo{IsAsync: true}

// Map methods
var MapDeleteInfo = compiler.FunctionInfo{IsAsync: true}
var MapLoadInfo = compiler.FunctionInfo{IsAsync: true}
var MapLoadAndDeleteInfo = compiler.FunctionInfo{IsAsync: true}
var MapLoadOrStoreInfo = compiler.FunctionInfo{IsAsync: true}
var MapRangeInfo = compiler.FunctionInfo{IsAsync: true}
var MapStoreInfo = compiler.FunctionInfo{IsAsync: true}

// Pool methods
var PoolGetInfo = compiler.FunctionInfo{IsAsync: false}
var PoolPutInfo = compiler.FunctionInfo{IsAsync: false}

// Functions
var OnceFuncInfo = compiler.FunctionInfo{IsAsync: false}
var OnceValueInfo = compiler.FunctionInfo{IsAsync: false}
var OnceValuesInfo = compiler.FunctionInfo{IsAsync: false}
var NewCondInfo = compiler.FunctionInfo{IsAsync: false}
