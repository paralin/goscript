in @expr-call.go WriteCallExpr is way too long. please split it into helper functions for each case. try to make the file smaller by eitiher moving things to other files or making new files if applicable.

Example of the structure you might use:

expr-call.go - Main call expression handler (much smaller)
expr-call-builtin.go - Built-in function calls (len, cap, panic, etc.)
expr-call-make.go - Make function calls (the most complex part)
expr-call-convert.go - Type conversions

We need to move the functions between files EXACTLY as they are written being careful to not make mistakes! Don't edit the comments or function implementations. After each move you make (add to new file, remove from old file) run `go build ./...` to verify the change.

Do this one helper function at a time. First analyze WriteCallExpr and determine all of the helper functions you will create, focus on the most critical first. Prioritize clearly repeated code that could be deduplicated with helper functions. Proceduralize this process.