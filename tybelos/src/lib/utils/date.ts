export function formatDateTime(ts: number) {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDate(ts: number) {
  const d = new Date(ts);
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium" }).format(d);
}

