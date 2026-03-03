export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 999_950) return "1.0M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function hotScore(recentInstalls: number, createdAt: Date | string): number {
  const hoursOld = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return recentInstalls / Math.pow(hoursOld + 2, 1.5);
}
