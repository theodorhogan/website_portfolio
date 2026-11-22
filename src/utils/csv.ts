/** Splits one CSV line into cells, honouring double-quoted fields and `""` escapes. */
export function parseCsvLine(line: string) {
  if (!line.includes('"')) {
    return line.split(",").map((cell) => cell.trim());
  }

  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

/** Parses a whole CSV document into rows of trimmed cells, skipping blank lines and a leading BOM. */
export function parseCsvRows(rawCsv: string) {
  const rows: string[][] = [];
  const text = rawCsv.charCodeAt(0) === 0xfeff ? rawCsv.slice(1) : rawCsv;

  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    rows.push(parseCsvLine(line));
  }

  return rows;
}

/** Strict numeric cell: blank or non-numeric cells are `null`, never 0. */
export function parseNumberCell(cell: string | undefined) {
  if (cell === undefined || cell === "") return null;
  const value = Number(cell);
  return Number.isFinite(value) ? value : null;
}
