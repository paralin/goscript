import * as $ from "@goscript/builtin/builtin.js";

import * as syscall from "@goscript/syscall/index.js"

type syscallErrorType = syscall.Errno;

let errENOSYS: syscall.Errno = syscall.ENOSYS

let errERANGE: syscall.Errno = syscall.ERANGE

let errENOMEM: syscall.Errno = syscall.ENOMEM

