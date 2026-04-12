import words from "../data/passwordWords.json";

export function generatePassword(): string {
  const picked: string[] = [];
  while (picked.length < 3) {
    const word = words[Math.floor(Math.random() * words.length)];
    if (!picked.includes(word)) picked.push(word);
  }
  const digit = Math.floor(Math.random() * 10);
  return `${picked.join("-")}-${digit}`;
}
