import type { Lift } from "@prisma/client";
import liftNames from "../data/liftNames.json";

export function assignLiftName(existingLifts: Lift[]): string {
  const activeNames = new Set(
    existingLifts.filter((l) => l.status !== "junked").map((l) => l.name)
  );

  // Shuffle the list and return the first name not already in use
  const shuffled = [...liftNames].sort(() => Math.random() - 0.5);
  for (const name of shuffled) {
    if (!activeNames.has(name)) return name;
  }

  // Fallback: all 100 base names are taken — pick a random base and append a number
  const base = liftNames[Math.floor(Math.random() * liftNames.length)];
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!activeNames.has(candidate)) return candidate;
  }
}
