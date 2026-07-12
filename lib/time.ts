// Tidszonshantering: tolka svenska vägg-klocktider (Europe/Stockholm) korrekt,
// oavsett var koden körs (Workers kör i UTC).

const TZ = "Europe/Stockholm";

function tzOffsetMinutes(atMs: number): number {
  const date = new Date(atMs);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - atMs) / 60000; // minuter som zonen ligger före UTC
}

// UTC-millisekunder för en svensk vägg-klocktid.
export function stockholmMs(datum: string, tid: string): number {
  const naive = new Date(`${datum}T${tid || "00:00"}:00Z`).getTime();
  const off = tzOffsetMinutes(naive);
  return naive - off * 60000;
}

export function hoursUntilStockholm(datum: string, tid: string): number {
  return (stockholmMs(datum, tid) - Date.now()) / 3600000;
}
