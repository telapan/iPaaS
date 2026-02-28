import type { DataRow, CrosswalkStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyCrosswalk(
  rows: DataRow[],
  step: TransformationStep,
  ctx: TransformContext
): Promise<DataRow[]> {
  const config = (step as CrosswalkStep).config;
  const mappings = await ctx.loadCrosswalk(config.crosswalkId);

  return rows.flatMap((row) => {
    const sourceValue = String(row[config.sourceField] ?? "");
    const mappedValue = mappings.get(sourceValue);

    if (mappedValue !== undefined) {
      return [{ ...row, [config.outputField]: mappedValue }];
    }

    switch (config.unmatchedBehavior) {
      case "keep_original":
        return [{ ...row, [config.outputField]: sourceValue }];
      case "set_null":
        return [{ ...row, [config.outputField]: null }];
      case "exclude_row":
        return [];
    }
  });
}
