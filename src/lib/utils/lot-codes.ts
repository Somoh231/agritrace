const COMMODITY_TO_CODE: Record<string, string> = {
  cocoa: "COC",
  rice: "RIC",
  rubber: "RUB",
  palm_oil: "PLM",
  coffee: "COF",
};

export function generateLotCode(commodity: string, sequence: number): string {
  const code = COMMODITY_TO_CODE[commodity] ?? "UNK";
  const year = new Date().getFullYear();
  const seq = Math.max(0, Math.trunc(sequence)).toString().padStart(5, "0");
  return `LIB-${code}-${year}-${seq}`;
}

export function parseLotCode(code: string) {
  const match = /^([A-Z]{3})-([A-Z]{3})-(\d{4})-(\d{5})$/.exec(code.trim());
  if (!match) {
    throw new Error(`Invalid lot code: ${code}`);
  }
  const [, country, commodity, year, sequence] = match;
  return {
    country,
    commodity,
    year: Number(year),
    sequence: Number(sequence),
  };
}

