import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { CRASH_SPECIALIST_PROMPT } from "./crashSpecialistPrompt";

export interface AiInvestigationResult {
  rawText: string;
}

export type AiInvestigator = (repoRoot: string) => Promise<AiInvestigationResult>;

function buildDefaultCodexArgs(repoRoot: string, outputPath: string): string[] {
  const args = [
    "exec",
    "--sandbox",
    "read-only",
    "--cd",
    repoRoot,
    "--output-last-message",
    outputPath,
    "-",
  ];

  if (process.env.BUG_HUNT_CODEX_MODEL) {
    args.splice(1, 0, "--model", process.env.BUG_HUNT_CODEX_MODEL);
  }

  return args;
}

function runProcess(command: string, args: string[], stdin: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with status ${code}`));
    });

    child.stdin.end(stdin);
  });
}

export const defaultAiInvestigator: AiInvestigator = async (repoRoot) => {
  const outputPath = path.join(repoRoot, ".bug-hunt", "crash-ai-output.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const command = process.env.BUG_HUNT_AI_COMMAND ?? "codex";
  const args = process.env.BUG_HUNT_AI_COMMAND
    ? ["exec", "--sandbox", "read-only", "--cd", repoRoot, "--output-last-message", outputPath, "-"]
    : buildDefaultCodexArgs(repoRoot, outputPath);

  await runProcess(command, args, CRASH_SPECIALIST_PROMPT, repoRoot);
  return { rawText: await fs.readFile(outputPath, "utf8") };
};
