import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Compile into a disposable directory: no test framework or generated files in the repo.
const output = mkdtempSync(join(tmpdir(), "odisse-tests-"));
const tests = readdirSync("tests")
  .filter((name) => name.endsWith(".test.ts"))
  .map((name) => join("tests", name));

function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

try {
  const compilation = run([
    "node_modules/typescript/bin/tsc",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--target",
    "es2022",
    "--esModuleInterop",
    "--strict",
    "--skipLibCheck",
    "--types",
    "node",
    "--outDir",
    output,
    ...tests,
  ]);
  process.exitCode =
    compilation ||
    run([
      "--test",
      ...tests.map((file) => join(output, file.replace(/\.ts$/, ".js"))),
    ]);
} finally {
  rmSync(output, { recursive: true, force: true });
}
