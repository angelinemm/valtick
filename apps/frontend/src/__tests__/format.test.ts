import { describe, it, expect } from "vitest";
import { formatMoney, formatMoneyPerSec } from "../utils/format";

describe("formatMoney", () => {
  it("formats 0 cents as $0.00", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("formats 1000 cents as $10.00", () => {
    expect(formatMoney(1000)).toBe("$10.00");
  });

  it("formats 1050 cents as $10.50", () => {
    expect(formatMoney(1050)).toBe("$10.50");
  });

  it("formats 1 cent as $0.01", () => {
    expect(formatMoney(1)).toBe("$0.01");
  });
});

describe("formatMoneyPerSec", () => {
  it("formats 550 cents as $5.50/sec", () => {
    expect(formatMoneyPerSec(550)).toBe("$5.50/sec");
  });
});
