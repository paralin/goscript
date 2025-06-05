import * as $ from '@goscript/builtin/index.js'
import { Errno } from './types.js'

export const EPERM: Errno = {
  Error: () => 'operation not permitted',
  Is: (target: $.GoError) => target === EPERM,
  Errno: () => 1,
}

export const ENOENT: Errno = {
  Error: () => 'no such file or directory',
  Is: (target: $.GoError) => target === ENOENT,
  Errno: () => 2,
}

export const ESRCH: Errno = {
  Error: () => 'no such process',
  Is: (target: $.GoError) => target === ESRCH,
  Errno: () => 3,
}

export const EINTR: Errno = {
  Error: () => 'interrupted system call',
  Is: (target: $.GoError) => target === EINTR,
  Errno: () => 4,
}

export const EIO: Errno = {
  Error: () => 'I/O error',
  Is: (target: $.GoError) => target === EIO,
  Errno: () => 5,
}

export const ENXIO: Errno = {
  Error: () => 'no such device or address',
  Is: (target: $.GoError) => target === ENXIO,
  Errno: () => 6,
}

export const E2BIG: Errno = {
  Error: () => 'argument list too long',
  Is: (target: $.GoError) => target === E2BIG,
  Errno: () => 7,
}

export const ENOEXEC: Errno = {
  Error: () => 'exec format error',
  Is: (target: $.GoError) => target === ENOEXEC,
  Errno: () => 8,
}

export const EBADF: Errno = {
  Error: () => 'bad file number',
  Is: (target: $.GoError) => target === EBADF,
  Errno: () => 9,
}

export const ECHILD: Errno = {
  Error: () => 'no child processes',
  Is: (target: $.GoError) => target === ECHILD,
  Errno: () => 10,
}

export const EAGAIN: Errno = {
  Error: () => 'try again',
  Is: (target: $.GoError) => target === EAGAIN,
  Errno: () => 11,
}

export const ENOMEM: Errno = {
  Error: () => 'out of memory',
  Is: (target: $.GoError) => target === ENOMEM,
  Errno: () => 12,
}

export const EACCES: Errno = {
  Error: () => 'permission denied',
  Is: (target: $.GoError) => target === EACCES,
  Errno: () => 13,
}

export const EFAULT: Errno = {
  Error: () => 'bad address',
  Is: (target: $.GoError) => target === EFAULT,
  Errno: () => 14,
}

export const EBUSY: Errno = {
  Error: () => 'device or resource busy',
  Is: (target: $.GoError) => target === EBUSY,
  Errno: () => 16,
}

export const EEXIST: Errno = {
  Error: () => 'file exists',
  Is: (target: $.GoError) => target === EEXIST,
  Errno: () => 17,
}

export const EXDEV: Errno = {
  Error: () => 'cross-device link',
  Is: (target: $.GoError) => target === EXDEV,
  Errno: () => 18,
}

export const ENODEV: Errno = {
  Error: () => 'no such device',
  Is: (target: $.GoError) => target === ENODEV,
  Errno: () => 19,
}

export const ENOTDIR: Errno = {
  Error: () => 'not a directory',
  Is: (target: $.GoError) => target === ENOTDIR,
  Errno: () => 20,
}

export const EISDIR: Errno = {
  Error: () => 'is a directory',
  Is: (target: $.GoError) => target === EISDIR,
  Errno: () => 21,
}

export const EINVAL: Errno = {
  Error: () => 'invalid argument',
  Is: (target: $.GoError) => target === EINVAL,
  Errno: () => 22,
}

export const ENFILE: Errno = {
  Error: () => 'file table overflow',
  Is: (target: $.GoError) => target === ENFILE,
  Errno: () => 23,
}

export const EMFILE: Errno = {
  Error: () => 'too many open files',
  Is: (target: $.GoError) => target === EMFILE,
  Errno: () => 24,
}

export const ENOTTY: Errno = {
  Error: () => 'not a typewriter',
  Is: (target: $.GoError) => target === ENOTTY,
  Errno: () => 25,
}

export const EFBIG: Errno = {
  Error: () => 'file too large',
  Is: (target: $.GoError) => target === EFBIG,
  Errno: () => 27,
}

export const ENOSPC: Errno = {
  Error: () => 'no space left on device',
  Is: (target: $.GoError) => target === ENOSPC,
  Errno: () => 28,
}

export const ESPIPE: Errno = {
  Error: () => 'illegal seek',
  Is: (target: $.GoError) => target === ESPIPE,
  Errno: () => 29,
}

export const EROFS: Errno = {
  Error: () => 'read-only file system',
  Is: (target: $.GoError) => target === EROFS,
  Errno: () => 30,
}

export const EMLINK: Errno = {
  Error: () => 'too many links',
  Is: (target: $.GoError) => target === EMLINK,
  Errno: () => 31,
}

export const EPIPE: Errno = {
  Error: () => 'broken pipe',
  Is: (target: $.GoError) => target === EPIPE,
  Errno: () => 32,
}

export const EDOM: Errno = {
  Error: () => 'math arg out of domain of func',
  Is: (target: $.GoError) => target === EDOM,
  Errno: () => 33,
}

export const ERANGE: Errno = {
  Error: () => 'result too large',
  Is: (target: $.GoError) => target === ERANGE,
  Errno: () => 34,
}

export const EDEADLK: Errno = {
  Error: () => 'deadlock condition',
  Is: (target: $.GoError) => target === EDEADLK,
  Errno: () => 35,
}

export const ENAMETOOLONG: Errno = {
  Error: () => 'file name too long',
  Is: (target: $.GoError) => target === ENAMETOOLONG,
  Errno: () => 36,
}

export const ENOLCK: Errno = {
  Error: () => 'no record locks available',
  Is: (target: $.GoError) => target === ENOLCK,
  Errno: () => 37,
}

export const ENOSYS: Errno = {
  Error: () => 'function not implemented',
  Is: (target: $.GoError) => target === ENOSYS,
  Errno: () => 38,
}

export const ENOTEMPTY: Errno = {
  Error: () => 'directory not empty',
  Is: (target: $.GoError) => target === ENOTEMPTY,
  Errno: () => 39,
}

export const ELOOP: Errno = {
  Error: () => 'too many symbolic links',
  Is: (target: $.GoError) => target === ELOOP,
  Errno: () => 40,
}

export const ENOMSG: Errno = {
  Error: () => 'no message of desired type',
  Is: (target: $.GoError) => target === ENOMSG,
  Errno: () => 42,
}

export const EIDRM: Errno = {
  Error: () => 'identifier removed',
  Is: (target: $.GoError) => target === EIDRM,
  Errno: () => 43,
}

export const ECHRNG: Errno = {
  Error: () => 'channel number out of range',
  Is: (target: $.GoError) => target === ECHRNG,
  Errno: () => 44,
}

export const EL2NSYNC: Errno = {
  Error: () => 'level 2 not synchronized',
  Is: (target: $.GoError) => target === EL2NSYNC,
  Errno: () => 45,
}

export const EL3HLT: Errno = {
  Error: () => 'level 3 halted',
  Is: (target: $.GoError) => target === EL3HLT,
  Errno: () => 46,
}

export const EL3RST: Errno = {
  Error: () => 'level 3 reset',
  Is: (target: $.GoError) => target === EL3RST,
  Errno: () => 47,
}

export const ELNRNG: Errno = {
  Error: () => 'link number out of range',
  Is: (target: $.GoError) => target === ELNRNG,
  Errno: () => 48,
}

export const EUNATCH: Errno = {
  Error: () => 'protocol driver not attached',
  Is: (target: $.GoError) => target === EUNATCH,
  Errno: () => 49,
}

export const ENOCSI: Errno = {
  Error: () => 'no CSI structure available',
  Is: (target: $.GoError) => target === ENOCSI,
  Errno: () => 50,
}

export const EL2HLT: Errno = {
  Error: () => 'level 2 halted',
  Is: (target: $.GoError) => target === EL2HLT,
  Errno: () => 51,
}

export const EBADE: Errno = {
  Error: () => 'invalid exchange',
  Is: (target: $.GoError) => target === EBADE,
  Errno: () => 52,
}

export const EBADR: Errno = {
  Error: () => 'invalid request descriptor',
  Is: (target: $.GoError) => target === EBADR,
  Errno: () => 53,
}

export const EXFULL: Errno = {
  Error: () => 'exchange full',
  Is: (target: $.GoError) => target === EXFULL,
  Errno: () => 54,
}

export const ENOANO: Errno = {
  Error: () => 'no anode',
  Is: (target: $.GoError) => target === ENOANO,
  Errno: () => 55,
}

export const EBADRQC: Errno = {
  Error: () => 'invalid request code',
  Is: (target: $.GoError) => target === EBADRQC,
  Errno: () => 56,
}

export const EBADSLT: Errno = {
  Error: () => 'invalid slot',
  Is: (target: $.GoError) => target === EBADSLT,
  Errno: () => 57,
}

export const EDEADLOCK: Errno = EDEADLK // File locking deadlock error

export const EBFONT: Errno = {
  Error: () => 'bad font file fmt',
  Is: (target: $.GoError) => target === EBFONT,
  Errno: () => 59,
}

export const ENOSTR: Errno = {
  Error: () => 'device not a stream',
  Is: (target: $.GoError) => target === ENOSTR,
  Errno: () => 60,
}

export const ENODATA: Errno = {
  Error: () => 'no data (for no delay io)',
  Is: (target: $.GoError) => target === ENODATA,
  Errno: () => 61,
}

export const ETIME: Errno = {
  Error: () => 'timer expired',
  Is: (target: $.GoError) => target === ETIME,
  Errno: () => 62,
}

export const ENOSR: Errno = {
  Error: () => 'out of streams resources',
  Is: (target: $.GoError) => target === ENOSR,
  Errno: () => 63,
}

export const ENONET: Errno = {
  Error: () => 'machine is not on the network',
  Is: (target: $.GoError) => target === ENONET,
  Errno: () => 64,
}

export const ENOPKG: Errno = {
  Error: () => 'package not installed',
  Is: (target: $.GoError) => target === ENOPKG,
  Errno: () => 65,
}

export const EREMOTE: Errno = {
  Error: () => 'the object is remote',
  Is: (target: $.GoError) => target === EREMOTE,
  Errno: () => 66,
}

export const ENOLINK: Errno = {
  Error: () => 'the link has been severed',
  Is: (target: $.GoError) => target === ENOLINK,
  Errno: () => 67,
}

export const EADV: Errno = {
  Error: () => 'advertise error',
  Is: (target: $.GoError) => target === EADV,
  Errno: () => 68,
}

export const ESRMNT: Errno = {
  Error: () => 'srmount error',
  Is: (target: $.GoError) => target === ESRMNT,
  Errno: () => 69,
}

export const ECOMM: Errno = {
  Error: () => 'communication error on send',
  Is: (target: $.GoError) => target === ECOMM,
  Errno: () => 70,
}

export const EPROTO: Errno = {
  Error: () => 'protocol error',
  Is: (target: $.GoError) => target === EPROTO,
  Errno: () => 71,
}

export const EMULTIHOP: Errno = {
  Error: () => 'multihop attempted',
  Is: (target: $.GoError) => target === EMULTIHOP,
  Errno: () => 72,
}

export const EDOTDOT: Errno = {
  Error: () => 'cross mount point (not really error)',
  Is: (target: $.GoError) => target === EDOTDOT,
  Errno: () => 73,
}

export const EBADMSG: Errno = {
  Error: () => 'trying to read unreadable message',
  Is: (target: $.GoError) => target === EBADMSG,
  Errno: () => 74,
}

export const EOVERFLOW: Errno = {
  Error: () => 'value too large for defined data type',
  Is: (target: $.GoError) => target === EOVERFLOW,
  Errno: () => 75,
}

export const ENOTUNIQ: Errno = {
  Error: () => 'given log. name not unique',
  Is: (target: $.GoError) => target === ENOTUNIQ,
  Errno: () => 76,
}

export const EBADFD: Errno = {
  Error: () => 'f.d. invalid for this operation',
  Is: (target: $.GoError) => target === EBADFD,
  Errno: () => 77,
}

export const EREMCHG: Errno = {
  Error: () => 'remote address changed',
  Is: (target: $.GoError) => target === EREMCHG,
  Errno: () => 78,
}

export const ELIBACC: Errno = {
  Error: () => "can't access a needed shared lib",
  Is: (target: $.GoError) => target === ELIBACC,
  Errno: () => 79,
}

export const ELIBBAD: Errno = {
  Error: () => 'accessing a corrupted shared lib',
  Is: (target: $.GoError) => target === ELIBBAD,
  Errno: () => 80,
}

export const ELIBSCN: Errno = {
  Error: () => '.lib section in a.out corrupted',
  Is: (target: $.GoError) => target === ELIBSCN,
  Errno: () => 81,
}

export const ELIBMAX: Errno = {
  Error: () => 'attempting to link in too many libs',
  Is: (target: $.GoError) => target === ELIBMAX,
  Errno: () => 82,
}

export const ELIBEXEC: Errno = {
  Error: () => 'attempting to exec a shared library',
  Is: (target: $.GoError) => target === ELIBEXEC,
  Errno: () => 83,
}

export const EILSEQ: Errno = {
  Error: () => 'illegal byte sequence',
  Is: (target: $.GoError) => target === EILSEQ,
  Errno: () => 84,
}

export const EUSERS: Errno = {
  Error: () => 'too many users',
  Is: (target: $.GoError) => target === EUSERS,
  Errno: () => 87,
}

export const ENOTSOCK: Errno = {
  Error: () => 'socket operation on non-socket',
  Is: (target: $.GoError) => target === ENOTSOCK,
  Errno: () => 88,
}

export const EDESTADDRREQ: Errno = {
  Error: () => 'destination address required',
  Is: (target: $.GoError) => target === EDESTADDRREQ,
  Errno: () => 89,
}

export const EMSGSIZE: Errno = {
  Error: () => 'message too long',
  Is: (target: $.GoError) => target === EMSGSIZE,
  Errno: () => 90,
}

export const EPROTOTYPE: Errno = {
  Error: () => 'protocol wrong type for socket',
  Is: (target: $.GoError) => target === EPROTOTYPE,
  Errno: () => 91,
}

export const ENOPROTOOPT: Errno = {
  Error: () => 'protocol not available',
  Is: (target: $.GoError) => target === ENOPROTOOPT,
  Errno: () => 92,
}

export const EPROTONOSUPPORT: Errno = {
  Error: () => 'unknown protocol',
  Is: (target: $.GoError) => target === EPROTONOSUPPORT,
  Errno: () => 93,
}

export const ESOCKTNOSUPPORT: Errno = {
  Error: () => 'socket type not supported',
  Is: (target: $.GoError) => target === ESOCKTNOSUPPORT,
  Errno: () => 94,
}

export const EOPNOTSUPP: Errno = {
  Error: () => 'operation not supported on transport endpoint',
  Is: (target: $.GoError) => target === EOPNOTSUPP,
  Errno: () => 95,
}

export const EPFNOSUPPORT: Errno = {
  Error: () => 'protocol family not supported',
  Is: (target: $.GoError) => target === EPFNOSUPPORT,
  Errno: () => 96,
}

export const EAFNOSUPPORT: Errno = {
  Error: () => 'address family not supported by protocol family',
  Is: (target: $.GoError) => target === EAFNOSUPPORT,
  Errno: () => 97,
}

export const EADDRINUSE: Errno = {
  Error: () => 'address already in use',
  Is: (target: $.GoError) => target === EADDRINUSE,
  Errno: () => 98,
}

export const EADDRNOTAVAIL: Errno = {
  Error: () => 'address not available',
  Is: (target: $.GoError) => target === EADDRNOTAVAIL,
  Errno: () => 99,
}

export const ENETDOWN: Errno = {
  Error: () => 'network interface is not configured',
  Is: (target: $.GoError) => target === ENETDOWN,
  Errno: () => 100,
}

export const ENETUNREACH: Errno = {
  Error: () => 'network is unreachable',
  Is: (target: $.GoError) => target === ENETUNREACH,
  Errno: () => 101,
}

export const ENETRESET: Errno = {
  Error: () => 'network dropped connection because of reset',
  Is: (target: $.GoError) => target === ENETRESET,
  Errno: () => 102,
}

export const ECONNABORTED: Errno = {
  Error: () => 'connection aborted',
  Is: (target: $.GoError) => target === ECONNABORTED,
  Errno: () => 103,
}

export const ECONNRESET: Errno = {
  Error: () => 'connection reset by peer',
  Is: (target: $.GoError) => target === ECONNRESET,
  Errno: () => 104,
}

export const ENOBUFS: Errno = {
  Error: () => 'no buffer space available',
  Is: (target: $.GoError) => target === ENOBUFS,
  Errno: () => 105,
}

export const EISCONN: Errno = {
  Error: () => 'socket is already connected',
  Is: (target: $.GoError) => target === EISCONN,
  Errno: () => 106,
}

export const ENOTCONN: Errno = {
  Error: () => 'socket is not connected',
  Is: (target: $.GoError) => target === ENOTCONN,
  Errno: () => 107,
}

export const ESHUTDOWN: Errno = {
  Error: () => "can't send after socket shutdown",
  Is: (target: $.GoError) => target === ESHUTDOWN,
  Errno: () => 108,
}

export const ETOOMANYREFS: Errno = {
  Error: () => 'too many references: cannot splice',
  Is: (target: $.GoError) => target === ETOOMANYREFS,
  Errno: () => 109,
}

export const ETIMEDOUT: Errno = {
  Error: () => 'connection timed out',
  Is: (target: $.GoError) => target === ETIMEDOUT,
  Errno: () => 110,
}

export const ECONNREFUSED: Errno = {
  Error: () => 'connection refused',
  Is: (target: $.GoError) => target === ECONNREFUSED,
  Errno: () => 111,
}

export const EHOSTDOWN: Errno = {
  Error: () => 'host is down',
  Is: (target: $.GoError) => target === EHOSTDOWN,
  Errno: () => 112,
}

export const EHOSTUNREACH: Errno = {
  Error: () => 'host is unreachable',
  Is: (target: $.GoError) => target === EHOSTUNREACH,
  Errno: () => 113,
}

export const EALREADY: Errno = {
  Error: () => 'socket already connected',
  Is: (target: $.GoError) => target === EALREADY,
  Errno: () => 114,
}

export const EDQUOT: Errno = {
  Error: () => 'quota exceeded',
  Is: (target: $.GoError) => target === EDQUOT,
  Errno: () => 122,
}