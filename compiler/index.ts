import * as path from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const execAsync = promisify(exec);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname); // Go up one level from src/ to the project root

/**
 * Configuration options for the GoScript compiler.
 */
export interface CompileConfig {
  /** The Go package path or pattern to compile. */
  pkg: string;
  /** The output directory for the generated TypeScript files. Defaults to './output'. */
  output?: string;
  /** The working directory for the compiler. Defaults to the current working directory. */
  dir?: string;
  /** The path to the goscript executable. Defaults to 'go run github.com/aperturerobotics/goscript/cmd/goscript'. */
  goscriptPath?: string;
}

/**
 * Compiles a Go package to TypeScript using the goscript compiler.
 * @param config - The compilation configuration.
 * @returns A promise that resolves when compilation is complete, or rejects on error.
 */
export async function compile(config: CompileConfig): Promise<void> {
  if (!config.pkg) {
    throw new Error("Package path (pkg) must be specified.");
  }

  // Construct the go run command with the absolute path to the goscript executable
  const goscriptCmd =
    config.goscriptPath ??
    `go run "${path.join(projectRoot, "./cmd/goscript")}"`;

  const args: string[] = ["compile", "--package", `"${config.pkg}"`];

  if (config.output) {
    args.push("--output", `"${path.resolve(config.output)}"`);
  } else {
    // Default output path if not specified, relative to the working directory
    args.push("--output", `"./output"`);
  }

  // Pass the working directory to the goscript command
  if (config.dir) {
    args.push("--dir", `"${path.resolve(config.dir)}"`);
  }

  const command = `${goscriptCmd} ${args.join(" ")}`;
  // Execute go run from the specified working directory (or current)
  const cwd = config.dir ? path.resolve(config.dir) : process.cwd();

  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stdout) {
      console.log(`GoScript stdout:\n${stdout}`);
    }
    if (stderr) {
      // Go compiler often prints status messages to stderr, treat as info unless exit code is non-zero
      console.info(`GoScript stderr:\n${stderr}`);
    }
  } catch (error: any) {  
    console.error(`GoScript compilation failed: ${error.message}`);
    if (error.stderr) {
      console.error(`GoScript stderr:\n${error.stderr}`);
    }
    if (error.stdout) {
      console.error(`GoScript stdout:\n${error.stdout}`);
    }
    throw new Error(`GoScript compilation failed: ${error.message}`);
  }
}

/**
 * Default export for convenience.
 */
export default {
  compile,
};
