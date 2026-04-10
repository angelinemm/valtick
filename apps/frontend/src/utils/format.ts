export function formatMoney(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

export function formatMoneyPerSec(cents: number): string {
  return formatMoney(cents) + "/sec";
}
