# Iterating on Compliance

Here is the workflow I use to iterate on compliance at the moment:

- try to run goscript against one of my Go projects
- get a compiler error or notice something that should be fixed
- copy paste this prompt into Cursor agent with claude-4-sonnet

The following is the prompt:

```
Create a new compliance test to replicate this compiler error: unhandled make statement: ... [rest of the error here]

The tests are located at ./compliance/tests/{testname}/testname.go with a package main and using println() only for output and trying to not import anything. To determine the "go test" command which will run specifically this test, use this as a template: `go test -timeout 30s -run ^TestCompliance/if_statement$ ./compiler` - run the compliance test to check if it passes. If not, review the output to see why. Deeply consider the generated TypeScript from the source Go code and think about what the correct TypeScript output would look like with as minimal of a change as possible.
Review the code as needed under `compiler/*.go` to determine what needs to be changed in order to fix the issue. Write this analysis and info about the task at hand to `compliance/WIP.md` overwriting any existing contents there.
Apply the changes you planned to the `compiler/` code. Then run the integration test again. Then repeatedly update the compiler code and/or `compliance/WIP.md` until you successfully implement the changes and the compliance test pass successfully.
```

Then a couple minutes later it has created a test and fixed an issue. Then I just run the rest of the tests, commit, push, and repeat. Eventually more and more is compiling. I think pretty complex programs should work well already.