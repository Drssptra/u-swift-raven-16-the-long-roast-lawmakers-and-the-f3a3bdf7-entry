// Entry for make.fun's "The Long Roast: Lawmakers and the File They Cannot Convert".
// Prints the roast to stdout and saves the same text to entry.txt inside the
// directory the harness points at with MAKEFUN_OUTPUT_DIR.
//
// Written in CommonJS style (Node 22 stdlib only) so `node main.ts` runs with
// no module-type warning on stderr.

const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

// The one-sentence roast. Keep this text exactly as submitted.
function entryText() {
  return "After three hours, four aides, and one very patient IT intern, the committee that regulates AI, crypto, and the entire internet finally converted its own bill to PDF — by printing it, scanning it, and emailing the scan to itself.";
}

// The entry plus one trailing newline — the exact bytes for both outputs.
function entryOutput() {
  return entryText() + "\n";
}

// Where the harness wants entry.txt (defaults to the current directory).
function resolveOutputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? ".";
}

// The file name the harness reads the entry from.
const ENTRY_FILE = "entry.txt";

// Write the entry to entry.txt inside the output directory.
// Returns the full path of the file that was written.
function writeEntryFile(outputDir) {
  mkdirSync(outputDir, { recursive: true });
  const filePath = join(outputDir, ENTRY_FILE);
  writeFileSync(filePath, entryOutput(), "utf8");
  return filePath;
}

// Print the entry to stdout.
function printEntry() {
  process.stdout.write(entryOutput());
}

function main() {
  const outputDir = resolveOutputDir();
  writeEntryFile(outputDir);
  printEntry();
}

main();
