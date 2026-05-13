export function currency(value) {
  const amount = Number(value || 0);
  return `৳${amount.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}

export function date(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function title(value) {
  if (!value) return "Unknown";
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function daysPastDue(value) {
  if (!value) return 0;
  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
