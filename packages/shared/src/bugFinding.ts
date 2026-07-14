export type NonEmptyArray<T> = [T, ...T[]];

export type BugFindingConfidence = "very_high" | "high" | "medium" | "low";

export const BUG_FINDING_CONFIDENCE_DESCRIPTIONS: Record<BugFindingConfidence, string> = {
  very_high: "The code logically guarantees the issue under a reachable condition.",
  high: "Strong evidence of a real issue, but one material assumption remains.",
  medium:
    "Plausible issue with multiple reasonable interpretations or environment/lifecycle dependencies.",
  low: "Suspicious pattern or genuine concern without enough evidence to call it a likely bug.",
};

export type BugFindingSeverity = "critical" | "high" | "medium" | "low";

export type BugFindingCategory =
  | "crash"
  | "logic"
  | "edge_case"
  | "security"
  | "data_integrity"
  | "async_lifecycle"
  | "spec_mismatch"
  | "performance";

export interface ProductRuleReference {
  filePath: "docs/product-rules.md";
  section?: string;
  rule?: string;
}

export interface CodeEvidence {
  filePath: string;
  startLine?: number;
  endLine?: number;
  explanation: string;
}

export interface BugFinding {
  // Stable across runs for the same suspected bug; do not use timestamps or random IDs.
  id: string;
  title: string;
  confidence: BugFindingConfidence;
  severity: BugFindingSeverity;
  category: BugFindingCategory;
  summary: string;
  expectedBehavior?: string;
  actualBehavior: string;
  productRule?: ProductRuleReference;
  evidence: NonEmptyArray<CodeEvidence>;
  // Concise evidence-based reasoning for reviewers; not hidden/internal chain of thought.
  reasoningChain: NonEmptyArray<string>;
  assumptions: string[];
  uncertainties: string[];
  suggestedNextStep: string;
}
