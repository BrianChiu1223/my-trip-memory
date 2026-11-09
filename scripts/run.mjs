import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2] ?? "dev";
if (!["dev", "setup", "check"].includes(mode))
  throw new Error("Unknown command");
let runtime = process.execPath;
const supportsRuntime = (version) => {
  const [major, minor] = version.replace(/^v/, "").split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 13);
};
if (!supportsRuntime(process.version)) {
  const bundled = path.join(
    homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node",
  );
  if (existsSync(bundled)) runtime = bundled;
}
const version = spawnSync(runtime, ["--version"], { encoding: "utf8" });
if (version.status !== 0 || !supportsRuntime(version.stdout.trim())) {
  console.error(
    "途屿需要 Node.js >= 22.13，推荐 Node.js 24 LTS。请安装后重试。",
  );
  process.exit(1);
}
const env = {
  ...process.env,
  PATH: `${path.dirname(runtime)}${path.delimiter}${process.env.PATH ?? ""}`,
};
const commands =
  mode === "setup"
    ? [["ci"]]
    : mode === "check"
      ? [["run", "typecheck"], ["test"], ["run", "build"]]
      : [
          [
            "run",
            "dev",
            "--",
            "--host",
            "127.0.0.1",
            "--port",
            process.env.PORT ?? "3000",
          ],
        ];
for (const args of commands) {
  const child = spawn("npm", ["--prefix", "web", ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  const forward = () => child.kill("SIGINT");
  process.once("SIGINT", forward);
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve(signal ? 130 : (code ?? 1)));
  });
  process.removeListener("SIGINT", forward);
  if (code !== 0) process.exit(code);
}
