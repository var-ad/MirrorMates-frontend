export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeCount(
  count: number,
  singular: string,
  plural?: string,
) {
  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural ?? `${singular}s`}`;
}

export function copyToClipboard(value: string) {
  return navigator.clipboard.writeText(value);
}
