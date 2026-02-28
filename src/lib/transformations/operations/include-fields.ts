import type { DataRow, IncludeFieldsStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyIncludeFields(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { fields } = (step as IncludeFieldsStep).config;
  const include = new Set(fields);
  return rows.map((row) => {
    const newRow: DataRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (include.has(key)) newRow[key] = value;
    }
    return newRow;
  });
}
