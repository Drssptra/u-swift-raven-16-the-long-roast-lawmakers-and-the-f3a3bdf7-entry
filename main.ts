// The Long Roast: Lawmakers and the File They Cannot Convert.
// make.fun entry — Node stdlib only, no network, fully deterministic.
//
// How this version differs from the previous one on purpose: the entry is
// held in one frozen config object instead of a helper function, the work is
// a small pipeline (validate -> render -> write -> print) driven from a
// single `run()` entry point, and every check is done on the UTF-8 bytes
// (Buffer) rather than on the JS string, so a stray newline or a wrong
// character cannot slip through unnoticed.

const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config: the entry itself and the harness contract around it.
// ---------------------------------------------------------------------------

const CONFIG = Object.freeze({
  // The roast, exactly as submitted. Do not edit a single character of this
  // string: the harness compares the file byte-for-byte against it.
  text: "The senator drafting America's first AI safety law just declared converting a file to PDF 'beyond current technology' — then filed his own bill as FINAL_v27_reallyfinal.docx.",
  fileName: "entry.txt",
  minChars: 1,
  maxChars: 320,
  // stdout gets the entry plus one newline; the file gets none.
  stdoutSuffix: "\n",
});

// ---------------------------------------------------------------------------
// Validation (byte-level, so encoding surprises are caught, not assumed).
// ---------------------------------------------------------------------------

function toBytes(text) {
  return Buffer.from(text, "utf8");
}

function checkLength(text) {
  const chars = [...text].length;
  if (chars < CONFIG.minChars || chars > CONFIG.maxChars) {
    throw new Error(
      `entry is ${chars} chars, outside the ${CONFIG.minChars}-${CONFIG.maxChars} gate`,
    );
  }
}

function checkNoControlChars(text) {
  // Newlines, tabs and other control characters have no place in a
  // one-sentence entry; the em dash and apostrophes are fine.
  for (const ch of text) {
    if (ch.codePointAt(0) < 0x20) {
      throw new Error(`entry contains a control character U+${ch.codePointAt(0).toString(16).padStart(4, "0")}`);
    }
  }
}

function checkShape(text) {
  // Cheap structural fingerprints of the submitted sentence: it must end
  // with the bill filename, contain the quoted phrase, and hold exactly
  // one em dash. These catch accidental edits far better than a bare
  // length check.
  if (!text.endsWith("FINAL_v27_reallyfinal.docx.")) {
    throw new Error("entry does not end with the expected bill filename");
  }
  if (!text.includes("'beyond current technology'")) {
    throw new Error("entry is missing the quoted phrase");
  }
  if ([...text].filter((ch) => ch === "—").length !== 1) {
    throw new Error("entry must contain exactly one em dash");
  }
}

function validate(text) {
  checkLength(text);
  checkNoControlChars(text);
  checkShape(text);
}

// ---------------------------------------------------------------------------
// Pipeline stages.
// ---------------------------------------------------------------------------

function resolveOutputDir() {
  const dir = process.env.MAKEFUN_OUTPUT_DIR;
  // Default to the current directory, as the previous version did, so a
  // run without the env var still writes entry.txt somewhere sensible.
  return typeof dir === "string" && dir.length > 0 ? dir : ".";
}

function writeEntry(outputDir, bytes) {
  fs.mkdirSync(outputDir, { recursive: true });
  const target = path.join(outputDir, CONFIG.fileName);
  fs.writeFileSync(target, bytes);
  return target;
}

// Read-back verification (second pass): re-read what was just written and
// refuse to print anything unless the bytes on disk are identical to the
// bytes we intended to write. A mismatch fails loudly instead of letting
// a silently corrupted entry reach the harness.
function verifyWrittenFile(target, expectedBytes) {
  const onDisk = fs.readFileSync(target);
  if (!onDisk.equals(expectedBytes)) {
    throw new Error(
      `read-back mismatch in ${target}: file is ${onDisk.length} bytes, expected ${expectedBytes.length} bytes`,
    );
  }
}

function printEntry(text) {
  process.stdout.write(text + CONFIG.stdoutSuffix);
}

function run() {
  const text = CONFIG.text;
  validate(text);
  const bytes = toBytes(text);
  const outputDir = resolveOutputDir();
  const target = writeEntry(outputDir, bytes);
  verifyWrittenFile(target, bytes);
  printEntry(text);
}

if (require.main === module) {
  run();
}
