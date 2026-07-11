// Validering och normalisering av svenskt personnummer.
// Hanterar format: YYMMDD-NNNN, YYMMDDNNNN, YYYYMMDD-NNNN, YYYYMMDDNNNN,
// med eller utan bindestreck/plus, samt samordningsnummer (dag + 60).

export type PnrResult = {
  valid: boolean;
  normalized?: string; // 12 siffror: YYYYMMDDNNNN
  display?: string; // YYYYMMDD-NNNN
  error?: string;
};

function luhnValid(tenDigits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let n = parseInt(tenDigits[i], 10);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function validatePersonnummer(input: string): PnrResult {
  if (!input || !input.trim()) {
    return { valid: false, error: "Personnummer krävs." };
  }
  const raw = input.trim();
  const isPlus = raw.includes("+");
  const digits = raw.replace(/[^0-9]/g, "");

  let body: string; // 10 siffror: YYMMDDNNNN (som Luhn beräknas på)
  let fullYear: number;

  if (digits.length === 12) {
    fullYear = parseInt(digits.slice(0, 4), 10);
    body = digits.slice(2);
  } else if (digits.length === 10) {
    body = digits;
    const twoYear = parseInt(digits.slice(0, 2), 10);
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    let century = now.getFullYear() - currentYY; // t.ex. 2000
    if (twoYear > currentYY) century -= 100;
    fullYear = century + twoYear;
    if (isPlus) fullYear -= 100;
  } else {
    return { valid: false, error: "Ogiltigt personnummer." };
  }

  const mm = parseInt(body.slice(2, 4), 10);
  let dd = parseInt(body.slice(4, 6), 10);
  if (dd > 60) dd -= 60; // samordningsnummer
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return { valid: false, error: "Ogiltigt datum i personnummret." };
  }

  if (!luhnValid(body)) {
    return { valid: false, error: "Personnumret verkar felaktigt (kontrollsiffra)." };
  }

  const normalized = String(fullYear).padStart(4, "0") + body.slice(2);
  const display = normalized.slice(0, 8) + "-" + normalized.slice(8);
  return { valid: true, normalized, display };
}
