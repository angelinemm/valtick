import resortNames from "../data/resortNames.json";

export function generateResortName(): string {
  return resortNames[Math.floor(Math.random() * resortNames.length)];
}
