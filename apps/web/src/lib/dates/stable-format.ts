const stableDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "UTC",
});

const stableDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function normalizeDateInput(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatStableDate(value: string | Date): string {
  return stableDateFormatter.format(normalizeDateInput(value));
}

export function formatStableDateTime(value: string | Date): string {
  return stableDateTimeFormatter.format(normalizeDateInput(value));
}
