import type { DataRow, SortStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applySort(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { sorts } = (step as SortStep).config;

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      let cmp: number;
      if (aVal == null && bVal == null) cmp = 0;
      else if (aVal == null) cmp = -1;
      else if (bVal == null) cmp = 1;
      else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      if (cmp !== 0) {
        return sort.direction === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}
