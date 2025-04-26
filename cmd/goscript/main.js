#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Go up two levels from cmd/goscript/ to the project root
const projectRoot = path.join(__dirname, '..', '..');

// Get arguments passed to the script, excluding node executable and script path
const args = process.argv.slice(2);

// Construct the go run command with the absolute path to the goscript executable
// Use path.join for robustness
const goscriptCmd = `go run "${path.join(projectRoot, "cmd", "goscript")}"`;

// Combine the goscript command with the arguments
const command = `${goscriptCmd} ${args.join(" ")}`;

// Execute the command
const child = spawn(command, {
  shell: true, // Use shell to correctly parse the command string
  stdio: 'inherit', // Inherit stdin, stdout, and stderr
  cwd: process.cwd(), // Execute in the current working directory where the script is run
});

child.on('error', (error) => {
  console.error(`Failed to start subprocess: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0); // Exit with the child process's exit code
});