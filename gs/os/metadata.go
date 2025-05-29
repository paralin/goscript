package os

// GsDependencies lists the import paths that this gs/ package requires
// These dependencies will be automatically copied when this package is included
var GsDependencies = []string{
	"errors",
	"internal/byteorder",
	"internal/goarch",
	"internal/poll",
	"io",
	"io/fs",
	"runtime",
	"sync",
	"syscall",
	"time",
	"unsafe",
}
