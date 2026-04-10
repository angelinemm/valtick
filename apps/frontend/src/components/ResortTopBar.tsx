import type { ResortDTO, SummaryDTO } from "@val-tick/shared";
import { formatMoney, formatMoneyPerSec } from "../utils/format";

interface Props {
  resort: ResortDTO;
  summary: SummaryDTO;
}

export function ResortTopBar({ resort, summary }: Props) {
  return (
    <header style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1rem", flexWrap: "wrap" }}>
      <span><strong>Resort:</strong> {resort.name}</span>
      <span><strong>Guest ID:</strong> {resort.guestId}</span>
      <span><strong>Money:</strong> {formatMoney(summary.moneyCents)}</span>
      <span><strong>Income:</strong> {formatMoneyPerSec(summary.incomePerSecCents)}</span>
      <span><strong>Capacity:</strong> {summary.capacityPerSec}/sec</span>
      <span><strong>Lifts:</strong> {summary.totalLifts}</span>
      <span><strong>Broken:</strong> {summary.brokenLiftsCount}</span>
    </header>
  );
}
