# GoScript Package Implementation Instructions

## Task: Implement the regexp handwritten package

Update gs/regexp/ to be a good hand-written TypeScript optimized goscript package for implementing the Go regexp package. We cannot change the function signatures for the identifiers listed in godoc.txt but we can change the implementations.

Goto statements are used often in gs/regexp/ - these don't work in TypeScript. Rewrite those functions.

Use `yarn typecheck` for typechecking.

Use `$.fooBar` for builtin.

Read compliance/WIP.md for our current progress and next steps before starting. Mark tasks as complete in there when done. Use it as a scratchpad.

Make sure we have full coverage of the regexp package in the package_import_regexp compliance test. Delete expected.log and rerun the test to re-generate the expected.log.

The tests are located at ./compliance/tests/{testname}/testname.go with a package main and using println() only for output and trying to not import anything. To determine the "go test" command which will run specifically this test, use this as a template: `go test -timeout 30s -run ^TestCompliance/package_import_regexp$ ./compiler` - run the compliance test to check if it passes. If not, review the output to see why. Deeply consider the generated TypeScript from the source Go code and think about what the correct TypeScript output would look like with as minimal of a change as possible.
Review the code as needed under `compiler/*.go` to determine what needs to be changed in order to fix the issue. Write this analysis and info about the task at hand to `compliance/WIP.md` overwriting any existing contents there.
Apply the changes you planned to the `compiler/` code. Then run the integration test again. Then repeatedly update the compiler code and/or `compliance/WIP.md` until you successfully implement the changes and the compliance test pass successfully.

## Steps to Generate and Move the Package

1. Generate the regexp package:
   ```
   go run github.com/aperturerobotics/goscript/cmd/goscript -- compile --deps --output ./out -p regexp
   ```

2. Move the generated package to gs directory:
   ```
   mv ./out/@goscript/regexp ./gs/
   ```

3. Apply the same treatment to ./gs/regexp as was done for ./gs/bytes, including adding a package_import_regexp compliance test.

## Implementation Guidelines

- Follow the existing patterns in the codebase
- Ensure TypeScript compatibility (no goto statements)
- Use `$.fooBar` for builtin functions
- Maintain function signatures as specified in godoc.txt
- Track progress in compliance/WIP.md
- Ensure full test coverage with package_import_regexp compliance test
- Run tests with `go test -timeout 30s -run ^TestCompliance/package_import_regexp$ ./compiler`
