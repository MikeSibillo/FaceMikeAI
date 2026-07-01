export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
}

