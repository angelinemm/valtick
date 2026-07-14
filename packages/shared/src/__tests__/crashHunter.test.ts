import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { BugFinding } from "../bugFinding";
import { validateBugFindings } from "../bugHunt/bugFindingValidation";
import { assertBugHuntOutputPath } from "../bugHunt/bugHuntOutput";
import { runCrashHunter } from "../bugHunt/crashHunter";

let repoRoot: string;

function writeFile(relativePath: string, contents: string): void {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents);
}

function makeFinding(overrides: Partial<BugFinding> = {}): BugFinding {
  return {
    id: "reachable-null-crash",
    title: "Reachable null crash",
    confidence: "high",
    severity: "medium",
    category: "crash",
    summary: "A reachable path can throw.",
    actualBehavior: "The handler dereferences a missing value.",
    evidence: [
      {
        filePath: "src/example.ts",
        startLine: 1,
        endLine: 1,
        explanation: "The dereference happens here.",
      },
    ],
    reasoningChain: ["The route can pass a missing value and this code dereferences it."],
    assumptions: ["The route remains publicly reachable."],
    uncertainties: ["Whether upstream middleware always normalizes this value."],
    suggestedNextStep: "Add runtime validation for the missing value.",
    ...overrides,
  };
}

beforeEach(() => {
  repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "valtick-bug-hunt-"));
  writeFile("src/example.ts", "export const example = 1;\n");
});

afterEach(() => {
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

describe("validateBugFindings", () => {
  it("accepts valid BugFinding[] output", () => {
    const result = validateBugFindings([makeFinding()], repoRoot);

    expect(result.validFindings).toHaveLength(1);
    expect(result.invalidFindings).toHaveLength(0);
  });

  it("rejects malformed output", () => {
    const result = validateBugFindings({ nope: true }, repoRoot);

    expect(result.validFindings).toHaveLength(0);
    expect(result.invalidFindings[0]?.errors).toContain("AI output findings must be an array");
  });

  it("rejects empty evidence", () => {
    const result = validateBugFindings([makeFinding({ evidence: [] as never })], repoRoot);

    expect(result.validFindings).toHaveLength(0);
    expect(result.invalidFindings[0]?.errors).toContain("evidence must be a non-empty array");
  });

  it("rejects invalid confidence, category, and severity", () => {
    const result = validateBugFindings(
      [
        makeFinding({
          confidence: "certain" as never,
          category: "style" as never,
          severity: "cosmetic" as never,
        }),
      ],
      repoRoot
    );

    expect(result.validFindings).toHaveLength(0);
    expect(result.invalidFindings[0]?.errors).toEqual(
      expect.arrayContaining([
        "confidence is not an allowed value",
        "severity is not an allowed value",
        "category is not an allowed value",
      ])
    );
  });

  it("rejects evidence paths outside or missing from the repository", () => {
    const outside = validateBugFindings(
      [makeFinding({ evidence: [{ ...makeFinding().evidence[0], filePath: "../outside.ts" }] })],
      repoRoot
    );
    const missing = validateBugFindings(
      [makeFinding({ evidence: [{ ...makeFinding().evidence[0], filePath: "src/missing.ts" }] })],
      repoRoot
    );

    expect(outside.validFindings).toHaveLength(0);
    expect(outside.invalidFindings[0]?.errors).toContain(
      "evidence[0].filePath must stay inside the repository"
    );
    expect(missing.validFindings).toHaveLength(0);
    expect(missing.invalidFindings[0]?.errors).toContain(
      "evidence[0].filePath does not exist in the repository"
    );
  });

  it("rejects invalid line ranges", () => {
    const result = validateBugFindings(
      [makeFinding({ evidence: [{ ...makeFinding().evidence[0], startLine: 5, endLine: 2 }] })],
      repoRoot
    );

    expect(result.validFindings).toHaveLength(0);
    expect(result.invalidFindings[0]?.errors).toContain(
      "evidence[0].endLine must be greater than or equal to startLine"
    );
  });
});

describe("runCrashHunter", () => {
  it("writes investigation output only under .bug-hunt", async () => {
    await runCrashHunter({
      repoRoot,
      generatedAt: "2026-07-14T00:00:00.000Z",
      aiInvestigator: async () => ({
        rawText: JSON.stringify({
          findings: [makeFinding()],
          investigation: {
            filesInspected: ["docs/product-rules.md", "src/example.ts"],
            productRuleSectionsConsidered: ["Tick And Income"],
            importantCodePathsTraced: ["route -> service"],
            areasInvestigatedWithNoFinding: ["catalog lookups"],
            areasNotConfidentlyAssessed: [],
          },
        }),
      }),
    });

    expect(fs.existsSync(path.join(repoRoot, ".bug-hunt/crash-findings.json"))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, ".bug-hunt/crash-investigation.json"))).toBe(true);
    expect(() => assertBugHuntOutputPath(repoRoot, "crash-findings.json")).toThrow(
      "Refusing to write outside .bug-hunt"
    );
  });

  it("excludes invalid findings from final findings and records diagnostics", async () => {
    await runCrashHunter({
      repoRoot,
      generatedAt: "2026-07-14T00:00:00.000Z",
      aiInvestigator: async () => ({
        rawText: JSON.stringify({
          findings: [makeFinding(), makeFinding({ evidence: [] as never })],
          investigation: {},
        }),
      }),
    });

    const findings = JSON.parse(
      fs.readFileSync(path.join(repoRoot, ".bug-hunt/crash-findings.json"), "utf8")
    ) as BugFinding[];
    const investigation = JSON.parse(
      fs.readFileSync(path.join(repoRoot, ".bug-hunt/crash-investigation.json"), "utf8")
    ) as { diagnostics: { invalidFindings: unknown[] } };

    expect(findings).toHaveLength(1);
    expect(investigation.diagnostics.invalidFindings).toHaveLength(1);
  });
});
