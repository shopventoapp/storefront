import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

// Keep private vocabulary out of this public repository, including this checker.
const forbiddenWords = [
  [103, 101, 110, 117, 115, 115, 119, 101, 114, 116, 101],
  [118, 105, 110, 111, 118, 105, 115, 116, 97],
  [100, 105, 101, 45, 119, 101, 105, 110, 98, 97, 114],
  [100, 105, 101, 32, 119, 101, 105, 110, 98, 97, 114],
  [115, 97, 98, 111, 114, 118, 105, 100, 97],
  [99, 117, 105, 115, 105, 110, 101, 115, 46, 99, 108, 111, 117, 100],
  [100, 101, 118, 46, 97, 122, 117, 114, 101, 46, 99, 111, 109],
].map((bytes) => String.fromCharCode(...bytes));
const checks = [
  ...forbiddenWords.map(
    (word) => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  ),
  /\bvv\.[a-z0-9-]/i,
  /https?:\/\/[^\s/]+\.(?:internal|local)(?:[/:\s]|$)/i,
  /\b(?:sk_live_|sk_test_|ghp_|github_pat_|AKIA)[a-zA-Z0-9_]{16,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
let failed = false;
function inspect(label: string, value: string) {
  if (checks.some((pattern) => pattern.test(value))) {
    // Print the location only, never a potential credential or private term.
    console.error(`Brand or secret check failed: ${label}`);
    failed = true;
  }
}
for (const path of paths) {
  if (
    /^(?:node_modules|\.next|out|dist|build|coverage|\.wrangler)\//.test(path)
  )
    continue;
  inspect("file path", path);
  const bytes = await readFile(path);
  if (bytes.includes(0)) continue;
  inspect(path, bytes.toString("utf8"));
}
try {
  inspect(
    "commit messages",
    execFileSync("git", ["log", "--all", "--format=%B%n%an <%ae>%n%cn <%ce>"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
} catch {
  // A freshly cloned starter may have no commits yet.
}
if (failed) process.exit(1);
console.log(`Brand and secret check passed (${paths.length} files).`);
