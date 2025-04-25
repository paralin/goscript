import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { compile } from "./index";
import * as path from "path";
import * as fs from "fs/promises";

const exampleDir = path.resolve(__dirname, "../example/simple");
const outputDir = path.join(exampleDir, "output"); // Use a separate output dir for tests
const expectedOutputFile = path.join(outputDir, "@go", "example", "main.gs.ts");

describe("GoScript Compiler API", () => {
  // Clean up before and after tests
  beforeAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });
  afterAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it("should compile the simple example package", async () => {
    const config = {
      pkg: ".", // Compile the package in the exampleDir
      dir: exampleDir,
      output: outputDir,
    };

    await expect(compile(config)).resolves.toBeUndefined();
    await expect(fs.access(expectedOutputFile)).resolves.toBeUndefined();
  }, 30000); // 30 second timeout for compilation
});
