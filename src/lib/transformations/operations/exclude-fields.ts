import type { DataRow, ExcludeFieldsStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyExcludeFields(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { fields } = (step as ExcludeFieldsStep).config;
  const exclude = new Set(fields);
  return rows.map((row) => {
    const newRow: DataRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (!exclude.has(key)) newRow[key] = value;
    }
    return newRow;
  });
}
