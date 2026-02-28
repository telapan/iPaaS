import type { DataRow, RenameFieldStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyRenameField(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { renames } = (step as RenameFieldStep).config;
  const renameMap = new Map(renames.map((r) => [r.from, r.to]));

  return rows.map((row) => {
    const newRow: DataRow = {};
    for (const [key, value] of Object.entries(row)) {
      const newKey = renameMap.get(key) || key;
      newRow[newKey] = value;
    }
    return newRow;
  });
}
