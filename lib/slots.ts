// Hjälp för tidsblock. Alla tider ligger på ett 30-minutersraster; en bokning
// kan spänna över flera block i följd beroende på behandlingens längd.

export const BLOCK = 15;

export function requiredBlocks(minutes: number): number {
  return Math.max(1, Math.ceil(minutes / BLOCK));
}

// Ger tiderna ("HH:MM") som en bokning täcker, från starttid och antal block.
export function slotTimes(startTid: string, blocks: number): string[] {
  const [h, m] = startTid.split(":").map((x) => parseInt(x, 10));
  let cur = h * 60 + m;
  const out: string[] = [];
  for (let i = 0; i < blocks; i++) {
    out.push(fmtMin(cur));
    cur += BLOCK;
  }
  return out;
}

function fmtMin(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
