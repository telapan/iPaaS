import Papa from "papaparse";

export interface CsvOptions {
  delimiter: string;
  quoteChar: string;
  encoding: "utf-8" | "utf-8-bom" | "ascii";
  includeHeader: boolean;
}

const defaultOptions: CsvOptions = {
  delimiter: ",",
  quoteChar: '"',
  encoding: "utf-8",
  includeHeader: true,
};

export function generateCsv(
  rows: Record<string, unknown>[],
  options?: Partial<CsvOptions>
): string {
  const opts = { ...defaultOptions, ...options };

  const csv = Papa.unparse(rows, {
    delimiter: opts.delimiter,
    quotes: true,
    quoteChar: opts.quoteChar,
    header: opts.includeHeader,
  });

  if (opts.encoding === "utf-8-bom") {
    return "\uFEFF" + csv;
  }
  return csv;
}

export function parseCsv<T = Record<string, string>>(
  text: string
): { data: T[]; fields: string[] } {
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return {
    data: parsed.data,
    fields: parsed.meta.fields || [],
  };
}
