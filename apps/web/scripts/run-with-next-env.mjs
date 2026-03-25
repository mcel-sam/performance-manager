import nextEnv from "@next/env";
import { spawn } from "node:child_process";

const { loadEnvConfig } = nextEnv;

const [, , ...commandArgs] = process.argv;

if (commandArgs.length === 0) {
  console.error("Usage: node scripts/run-with-next-env.mjs <command> [...args]");
  process.exit(1);
}

loadEnvConfig(process.cwd());

const child = spawn(commandArgs[0], commandArgs.slice(1), {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
