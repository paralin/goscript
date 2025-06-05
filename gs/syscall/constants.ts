// Essential syscall constants
export const O_RDONLY = 0
export const O_WRONLY = 1
export const O_RDWR = 2
export const O_APPEND = 8
export const O_CREATE = 64
export const O_EXCL = 128
export const O_SYNC = 256
export const O_TRUNC = 512

export const Stdin = 0
export const Stdout = 1
export const Stderr = 2

export const SIGINT = 2
export const SIGTERM = 15

// File mode constants
export const S_IFMT = 0o170000
export const S_IFREG = 0o100000
export const S_IFDIR = 0o040000
export const S_IFLNK = 0o120000
export const S_IFBLK = 0o060000
export const S_IFCHR = 0o020000
export const S_IFIFO = 0o010000
export const S_IFSOCK = 0o140000
export const S_ISUID = 0o004000
export const S_ISGID = 0o002000
export const S_ISVTX = 0o001000 