import type { DataRow, DeduplicateStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyDeduplicate(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { fields, keepFirst } = (step as DeduplicateStep).config;

  const keyFields =
    fields.length > 0 ? fields : Object.keys(rows[0] || {});

  if (!keepFirst) {
    rows = [...rows].reverse();
  }

  const seen = new Set<string>();
  const result: DataRow[] = [];

  for (const row of rows) {
    const key = keyFields.map((f) => String(row[f] ?? "")).join("|||");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(row);
    }
  }

  if (!keepFirst) {
    result.reverse();
  }

  return result;
}
