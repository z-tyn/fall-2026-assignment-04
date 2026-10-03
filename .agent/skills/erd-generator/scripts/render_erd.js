import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const inputFile = process.argv[2] || path.join('docs', 'architecture', 'schema.mmd');
const outputFile = process.argv[3] || path.join('docs', 'architecture', 'erd.svg');

const resolvedInput = path.resolve(process.cwd(), inputFile);
const resolvedOutput = path.resolve(process.cwd(), outputFile);

// Validate input file exists
if (!fs.existsSync(resolvedInput)) {
  console.error(`SYNTAX_ERROR: Input file "${inputFile}" does not exist.`);
  process.exit(1);
}

// Ensure target output directory exists
const outputDir = path.dirname(resolvedOutput);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Ensure library path for headless browser dependencies in Linux / WSL environments
const env = { ...process.env };
const localLibDir = path.join(os.homedir(), '.local', 'lib');
if (fs.existsSync(localLibDir)) {
  env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH
    ? `${localLibDir}:${env.LD_LIBRARY_PATH}`
    : localLibDir;
}

// Execute mermaid-cli (mmdc)
const mmdc = spawn('npx', ['mmdc', '-i', resolvedInput, '-o', resolvedOutput], {
  env,
  shell: process.platform === 'win32',
});

let stdout = '';
let stderr = '';

mmdc.stdout.on('data', (data) => {
  stdout += data.toString();
});

mmdc.stderr.on('data', (data) => {
  stderr += data.toString();
});

mmdc.on('error', (err) => {
  console.error(`SYNTAX_ERROR: ${err.message}`);
  process.exit(1);
});

mmdc.on('close', (code) => {
  if (code === 0 && fs.existsSync(resolvedOutput)) {
    console.log('SUCCESS');
    process.exit(0);
  } else {
    const errorDetails = stderr.trim() || stdout.trim() || `mmdc exited with code ${code}`;
    console.error(`SYNTAX_ERROR:\n${errorDetails}`);
    process.exit(1);
  }
});
