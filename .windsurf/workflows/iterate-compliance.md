---
description: Iterate on compliance
---

You should follow this process unless the user request requires otherwise:

1.  Read `compliance/COMPLIANCE.md` and identify the next most important incremental language feature we should implement given the ones implemented so far.
2.  Create a test case for the new compliance by adding a directory in `compliance/tests/` using `compliance/tests/if_statement` as an example of how to write a compliance test. You don't need to write `expected.log` or `*.gs.ts` files since these will be created when running the test.
3.  Think hard to determine the "go test" command which will run specifically this test, use this as a template: `go test -timeout 30s -run ^TestCompliance/if_statement$ ./compiler` - run the compliance test to check if it passes. If not, review the output to see why. Deeply consider the generated TypeScript from the source Go code and think about what the correct TypeScript output would look like with as minimal of a change as possible. Write this analysis and info about the task at hand to `compliance/WIP.md` overwriting any existing contents there.
4.  Review the code under `compiler/*.go` to determine what needs to be changed in order to fix the issue. Update `compliance/WIP.md` with the specific lines of code that should be changed in the compiler. (Plan it first).
5.  Apply the changes you planned to the `compiler/` code. Then run the integration test again. Then repeatedly update the compiler code and/or `compliance/WIP.md` until you successfully implement the changes and the compliance test pass successfully. If you make two or more edits and the test still does not pass, ask the user how to proceed providing several options for them to chose from.
6.  Re-run the top level compliance test to verify everything works properly now - the other tests: `go test -v ./compiler`
7.  Update `compliance/COMPLIANCE.md` as needed marking the now-compliant language features following the existing pattern. Make a git commit when done. You can use `git add -A && git commit -a -s` to commit all files in worktree (no need to add or remove files).

After finishing step #7 you are done.