export function env(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function envNum(name: string, fallback?: number) {
  const v = process.env[name];
  if (v === undefined) {
    if (fallback === undefined) throw new Error(`Missing env var: ${name}`);
    return fallback;
  }
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Env var ${name} must be a number`);
  return n;
}
