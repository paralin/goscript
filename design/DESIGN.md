# Package Structure

This is the typical package structure of the output TypeScript import path:

```
@go/ # Typical Go workspace, all packages live here.
  runtime
  encoding/json
  github.com/
     myuser/
        myproject/
```

The `goscript npm-vendor` tool vendors TypeScript dependencies and project components from a package.json and an already `npm install` built `node_modules` path, as well as optionally a `tsconfig.json` used to discover project components, into the Go `vendor` tree. It does so by translating TypeScript code into Go code, with the following GoPath tree:

```
@ts/
   mypackage
   @angular/
     language-service
```

Early iterations will generate "stubs" in this path, but it is planned to attempt to convert any TypeScript code into native Go eventually.

