import { describe, it, expect } from "vitest";
import type { Lift } from "@prisma/client";
import liftNames from "../data/liftNames.json";
import { assignLiftName } from "../utils/liftNameGenerator";

function makeLift(name: string, status: "working" | "broken" | "junked"): Lift {
  return { name, status } as unknown as Lift;
}

describe("assignLiftName", () => {
  it("returns a string when given no existing lifts", () => {
    const name = assignLiftName([]);
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  it("returns a name not used by any active lift", () => {
    const usedName = "Aspen Glide";
    const existing = [makeLift(usedName, "working")];
    // Run many times to account for randomness — should never return the used name
    for (let i = 0; i < 50; i++) {
      expect(assignLiftName(existing)).not.toBe(usedName);
    }
  });

  it("junked lifts free their name — it can be reused", () => {
    // Use all names as active except "Aspen Glide" which is junked
    const active = liftNames.slice(1).map((n) => makeLift(n, "working"));
    const junked = makeLift("Aspen Glide", "junked");
    const result = assignLiftName([...active, junked]);
    expect(result).toBe("Aspen Glide");
  });

  it("appends ' 2' when all 100 base names are taken by active lifts", () => {
    const existing = liftNames.map((n) => makeLift(n, "working"));
    const result = assignLiftName(existing);
    expect(result).toMatch(/ 2$/);
  });

  it("increments to 3 when both the base name and ' 2' variant are taken", () => {
    const existing = [
      ...liftNames.map((n) => makeLift(n, "working")),
      ...liftNames.map((n) => makeLift(`${n} 2`, "working")),
    ];
    const result = assignLiftName(existing);
    expect(result).toMatch(/ 3$/);
  });
});
