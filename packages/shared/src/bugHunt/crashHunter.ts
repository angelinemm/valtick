import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateBugFindings } from "./bugFindingValidation";
import {
  buildCrashInvestigationSummary,
  writeCrashBugHuntOutputs,
  type SpecialistInvestigationInput,
} from "./bugHuntOutput";
import { defaultAiInvestigator, type AiInvestigator } from "./aiBoundary";
import { CRASH_SPECIALIST_NAME } from "./crashSpecialistPrompt";

const execFileAsync = promisify(execFile);

interface ParsedAiOutput {
  findings?: unknown;
  investigation?: SpecialistInvestigationInput;
}

function parseJsonObject(rawText: string): ParsedAiOutput {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("AI returned an empty response");
  }

  return JSON.parse(trimmed) as ParsedAiOutput;
}

async function getGitCommitSha(repoRoot: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repoRoot });
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function runCrashHunter(params: {
  repoRoot: string;
  aiInvestigator?: AiInvestigator;
  generatedAt?: string;
}): Promise<void> {
  const aiInvestigator = params.aiInvestigator ?? defaultAiInvestigator;
  const gitCommitSha = await getGitCommitSha(params.repoRoot);
  const { rawText } = await aiInvestigator(params.repoRoot);

  let parsed: ParsedAiOutput = {};
  let rawOutputParseError: string | undefined;
  try {
    parsed = parseJsonObject(rawText);
  } catch (error) {
    rawOutputParseError = error instanceof Error ? error.message : "Unknown JSON parse error";
  }

  const validation = validateBugFindings(parsed.findings, params.repoRoot);
  const investigation = buildCrashInvestigationSummary({
    generatedAt: params.generatedAt ?? new Date().toISOString(),
    gitCommitSha,
    specialistName: CRASH_SPECIALIST_NAME,
    investigation: parsed.investigation ?? {},
    findings: validation.validFindings,
    invalidFindings: validation.invalidFindings,
    rawOutputParseError,
  });

  await writeCrashBugHuntOutputs({
    repoRoot: params.repoRoot,
    findings: validation.validFindings,
    investigation,
  });
}
