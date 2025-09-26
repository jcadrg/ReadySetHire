export function truncateMiddle(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2);
  return text.slice(0, half) + ' ... ' + text.slice(-half);
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
