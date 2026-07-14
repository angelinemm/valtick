import fs from "node:fs/promises";
import path from "node:path";
import type { BugFinding, BugFindingConfidence } from "../bugFinding";
import type { ValidationIssue } from "./bugFindingValidation";
import { isPathInside } from "./bugFindingValidation";

export interface SpecialistInvestigationInput {
  filesInspected?: unknown;
  productRuleSectionsConsidered?: unknown;
  importantCodePathsTraced?: unknown;
  areasInvestigatedWithNoFinding?: unknown;
  areasNotConfidentlyAssessed?: unknown;
}

export interface CrashInvestigationSummary {
  generatedAt: string;
  gitCommitSha?: string;
  specialistName: string;
  filesInspected: string[];
  productRuleSectionsConsidered: string[];
  importantCodePathsTraced: string[];
  areasInvestigatedWithNoFinding: string[];
  areasNotConfidentlyAssessed: string[];
  findingsByConfidence: Record<BugFindingConfidence, number>;
  diagnostics: {
    invalidFindings: ValidationIssue[];
    rawOutputParseError?: string;
  };
}

export const BUG_HUNT_DIR = ".bug-hunt";
export const CRASH_FINDINGS_PATH = ".bug-hunt/crash-findings.json";
export const CRASH_INVESTIGATION_PATH = ".bug-hunt/crash-investigation.json";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function assertBugHuntOutputPath(repoRoot: string, outputPath: string): string {
  const bugHuntDir = path.resolve(repoRoot, BUG_HUNT_DIR);
  const resolved = path.resolve(repoRoot, outputPath);

  if (!isPathInside(bugHuntDir, resolved)) {
    throw new Error(`Refusing to write outside ${BUG_HUNT_DIR}: ${outputPath}`);
  }

  return resolved;
}

export function countFindingsByConfidence(
  findings: BugFinding[]
): Record<BugFindingConfidence, number> {
  return findings.reduce<Record<BugFindingConfidence, number>>(
    (counts, finding) => {
      counts[finding.confidence] += 1;
      return counts;
    },
    { very_high: 0, high: 0, medium: 0, low: 0 }
  );
}

export function buildCrashInvestigationSummary(params: {
  generatedAt: string;
  gitCommitSha?: string;
  specialistName: string;
  investigation: SpecialistInvestigationInput;
  findings: BugFinding[];
  invalidFindings: ValidationIssue[];
  rawOutputParseError?: string;
}): CrashInvestigationSummary {
  return {
    generatedAt: params.generatedAt,
    ...(params.gitCommitSha ? { gitCommitSha: params.gitCommitSha } : {}),
    specialistName: params.specialistName,
    filesInspected: asStringArray(params.investigation.filesInspected),
    productRuleSectionsConsidered: asStringArray(
      params.investigation.productRuleSectionsConsidered
    ),
    importantCodePathsTraced: asStringArray(params.investigation.importantCodePathsTraced),
    areasInvestigatedWithNoFinding: asStringArray(
      params.investigation.areasInvestigatedWithNoFinding
    ),
    areasNotConfidentlyAssessed: asStringArray(params.investigation.areasNotConfidentlyAssessed),
    findingsByConfidence: countFindingsByConfidence(params.findings),
    diagnostics: {
      invalidFindings: params.invalidFindings,
      ...(params.rawOutputParseError ? { rawOutputParseError: params.rawOutputParseError } : {}),
    },
  };
}

export async function writeCrashBugHuntOutputs(params: {
  repoRoot: string;
  findings: BugFinding[];
  investigation: CrashInvestigationSummary;
}): Promise<void> {
  const findingsPath = assertBugHuntOutputPath(params.repoRoot, CRASH_FINDINGS_PATH);
  const investigationPath = assertBugHuntOutputPath(params.repoRoot, CRASH_INVESTIGATION_PATH);

  await fs.mkdir(path.dirname(findingsPath), { recursive: true });
  await fs.writeFile(findingsPath, `${JSON.stringify(params.findings, null, 2)}\n`);
  await fs.writeFile(investigationPath, `${JSON.stringify(params.investigation, null, 2)}\n`);
}
