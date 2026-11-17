const TZ = "America/Lima";

function dayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** «hoy», «mañana», «en 3 días» o la fecha, siempre con la fecha exacta disponible. */
export function relativeDay(iso: string, now: Date = new Date(), timeZone = TZ): string {
  const target = new Date(iso);
  const days = Math.round(
    (Date.parse(dayKey(target, timeZone)) - Date.parse(dayKey(now, timeZone))) / 86_400_000,
  );
  if (days < 0) return "vencido";
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  return `en ${days} días`;
}

export function longDate(iso: string, timeZone = TZ): string {
  return new Intl.DateTimeFormat("es-419", { timeZone, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(iso),
  );
}
