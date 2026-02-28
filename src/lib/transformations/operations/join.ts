import type { DataRow, JoinStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyJoin(
  rows: DataRow[],
  step: TransformationStep,
  ctx: TransformContext
): Promise<DataRow[]> {
  const config = (step as JoinStep).config;

  const rightRows = await ctx.fetchTableData(
    config.targetConnectionId,
    config.targetSchema,
    config.targetTable
  );

  const rightMap = new Map<string, DataRow[]>();
  for (const rRow of rightRows) {
    const key = config.on
      .map((j) => String(rRow[j.targetField] ?? ""))
      .join("|||");
    if (!rightMap.has(key)) rightMap.set(key, []);
    rightMap.get(key)!.push(rRow);
  }

  const result: DataRow[] = [];
  const matchedRightKeys = new Set<string>();

  for (const lRow of rows) {
    const key = config.on
      .map((j) => String(lRow[j.sourceField] ?? ""))
      .join("|||");
    const matches = rightMap.get(key) || [];

    if (matches.length > 0) {
      matchedRightKeys.add(key);
      for (const rRow of matches) {
        const merged: DataRow = { ...lRow };
        for (const [k, v] of Object.entries(rRow)) {
          if (config.selectFields && !config.selectFields.includes(k)) continue;
          const outKey = k in lRow ? `${config.targetTable}_${k}` : k;
          merged[outKey] = v;
        }
        result.push(merged);
      }
    } else if (config.joinType === "left") {
      result.push({ ...lRow });
    }
  }

  if (config.joinType === "right") {
    for (const [key, rRows] of rightMap) {
      if (!matchedRightKeys.has(key)) {
        for (const rRow of rRows) {
          result.push({ ...rRow });
        }
      }
    }
  }

  return result;
}
