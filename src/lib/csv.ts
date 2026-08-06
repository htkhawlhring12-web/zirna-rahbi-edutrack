type Column<T> = { key: keyof T; label: string };

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Quote any cell containing a comma, quote, or newline, doubling
  // internal quotes -- the standard CSV escaping rule (RFC 4180).
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects into a CSV string given an explicit column
 * list (so column order and headers are always predictable, regardless of
 * key order on the objects themselves).
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Column<T>[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.key])).join(",")
  );
  return [header, ...lines].join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
