export function createId(prefix: string) {
  const now = Date.now().toString(36);
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${now}_${rand}`;
}

