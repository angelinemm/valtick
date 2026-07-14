import { runCrashHunter } from "./crashHunter";

void runCrashHunter({ repoRoot: process.cwd() }).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
