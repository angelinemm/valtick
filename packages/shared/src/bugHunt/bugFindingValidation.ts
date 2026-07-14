import fs from "node:fs";
import path from "node:path";
import type {
  BugFinding,
  BugFindingCategory,
  BugFindingConfidence,
  BugFindingSeverity,
  CodeEvidence,
  ProductRuleReference,
} from "../bugFinding";

const ALLOWED_CONFIDENCE = new Set<BugFindingConfidence>(["very_high", "high", "medium", "low"]);
const ALLOWED_SEVERITY = new Set<BugFindingSeverity>(["critical", "high", "medium", "low"]);
const ALLOWED_CATEGORY = new Set<BugFindingCategory>([
  "crash",
  "logic",
  "edge_case",
  "security",
  "data_integrity",
  "async_lifecycle",
  "spec_mismatch",
  "performance",
]);

export interface ValidationIssue {
  index: number;
  id?: string;
  errors: string[];
  rawFinding?: unknown;
}

export interface ValidationResult {
  validFindings: BugFinding[];
  invalidFindings: ValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyStringArray(value: unknown): value is [string, ...string[]] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

export function isPathInside(parentDir: string, candidatePath: string): boolean {
  const relative = path.relative(parentDir, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function resolveRepositoryPath(repoRoot: string, filePath: string): string | null {
  if (!isNonEmptyString(filePath) || path.isAbsolute(filePath)) {
    return null;
  }

  const resolved = path.resolve(repoRoot, filePath);
  return isPathInside(path.resolve(repoRoot), resolved) ? resolved : null;
}

function validateProductRule(value: unknown, errors: string[]): ProductRuleReference | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    errors.push("productRule must be an object when supplied");
    return undefined;
  }

  if (value.filePath !== "docs/product-rules.md") {
    errors.push("productRule.filePath must be docs/product-rules.md");
  }

  if (value.section !== undefined && typeof value.section !== "string") {
    errors.push("productRule.section must be a string when supplied");
  }

  if (value.rule !== undefined && typeof value.rule !== "string") {
    errors.push("productRule.rule must be a string when supplied");
  }

  return value as unknown as ProductRuleReference;
}

function validateEvidence(
  value: unknown,
  repoRoot: string,
  errors: string[]
): [CodeEvidence, ...CodeEvidence[]] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push("evidence must be a non-empty array");
    return undefined;
  }

  const evidence = value.flatMap((item, evidenceIndex) => {
    if (!isRecord(item)) {
      errors.push(`evidence[${evidenceIndex}] must be an object`);
      return [];
    }

    if (!isNonEmptyString(item.filePath)) {
      errors.push(`evidence[${evidenceIndex}].filePath must be a non-empty string`);
      return [];
    }

    const resolved = resolveRepositoryPath(repoRoot, item.filePath);
    if (!resolved) {
      errors.push(`evidence[${evidenceIndex}].filePath must stay inside the repository`);
    } else if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      errors.push(`evidence[${evidenceIndex}].filePath does not exist in the repository`);
    }

    if (!isNonEmptyString(item.explanation)) {
      errors.push(`evidence[${evidenceIndex}].explanation must be non-empty`);
    }

    const startLine = item.startLine;
    const endLine = item.endLine;
    if (startLine !== undefined && (!Number.isInteger(startLine) || (startLine as number) < 1)) {
      errors.push(`evidence[${evidenceIndex}].startLine must be a positive integer`);
    }
    if (endLine !== undefined && (!Number.isInteger(endLine) || (endLine as number) < 1)) {
      errors.push(`evidence[${evidenceIndex}].endLine must be a positive integer`);
    }
    if (
      Number.isInteger(startLine) &&
      Number.isInteger(endLine) &&
      (endLine as number) < (startLine as number)
    ) {
      errors.push(`evidence[${evidenceIndex}].endLine must be greater than or equal to startLine`);
    }

    return [item as unknown as CodeEvidence];
  });

  return evidence.length > 0 ? (evidence as [CodeEvidence, ...CodeEvidence[]]) : undefined;
}

export function validateBugFindings(rawFindings: unknown, repoRoot: string): ValidationResult {
  if (!Array.isArray(rawFindings)) {
    return {
      validFindings: [],
      invalidFindings: [
        { index: -1, errors: ["AI output findings must be an array"], rawFinding: rawFindings },
      ],
    };
  }

  const validFindings: BugFinding[] = [];
  const invalidFindings: ValidationIssue[] = [];

  rawFindings.forEach((rawFinding, index) => {
    const errors: string[] = [];

    if (!isRecord(rawFinding)) {
      invalidFindings.push({ index, errors: ["finding must be an object"], rawFinding });
      return;
    }

    const id = typeof rawFinding.id === "string" ? rawFinding.id : undefined;

    for (const field of [
      "id",
      "title",
      "summary",
      "actualBehavior",
      "suggestedNextStep",
    ] as const) {
      if (!isNonEmptyString(rawFinding[field])) {
        errors.push(`${field} must be a non-empty string`);
      }
    }

    if (
      rawFinding.expectedBehavior !== undefined &&
      typeof rawFinding.expectedBehavior !== "string"
    ) {
      errors.push("expectedBehavior must be a string when supplied");
    }

    if (!ALLOWED_CONFIDENCE.has(rawFinding.confidence as BugFindingConfidence)) {
      errors.push("confidence is not an allowed value");
    }
    if (!ALLOWED_SEVERITY.has(rawFinding.severity as BugFindingSeverity)) {
      errors.push("severity is not an allowed value");
    }
    if (!ALLOWED_CATEGORY.has(rawFinding.category as BugFindingCategory)) {
      errors.push("category is not an allowed value");
    }

    const productRule = validateProductRule(rawFinding.productRule, errors);
    const evidence = validateEvidence(rawFinding.evidence, repoRoot, errors);

    if (!isNonEmptyStringArray(rawFinding.reasoningChain)) {
      errors.push("reasoningChain must be a non-empty string array");
    }
    if (!isStringArray(rawFinding.assumptions)) {
      errors.push("assumptions must be a string array");
    }
    if (!isStringArray(rawFinding.uncertainties)) {
      errors.push("uncertainties must be a string array");
    }

    if (errors.length > 0 || !evidence) {
      invalidFindings.push({ index, id, errors, rawFinding });
      return;
    }

    validFindings.push({
      id: rawFinding.id as string,
      title: rawFinding.title as string,
      confidence: rawFinding.confidence as BugFindingConfidence,
      severity: rawFinding.severity as BugFindingSeverity,
      category: rawFinding.category as BugFindingCategory,
      summary: rawFinding.summary as string,
      ...(rawFinding.expectedBehavior !== undefined
        ? { expectedBehavior: rawFinding.expectedBehavior as string }
        : {}),
      actualBehavior: rawFinding.actualBehavior as string,
      ...(productRule ? { productRule } : {}),
      evidence,
      reasoningChain: rawFinding.reasoningChain as [string, ...string[]],
      assumptions: rawFinding.assumptions as string[],
      uncertainties: rawFinding.uncertainties as string[],
      suggestedNextStep: rawFinding.suggestedNextStep as string,
    });
  });

  return { validFindings, invalidFindings };
}
