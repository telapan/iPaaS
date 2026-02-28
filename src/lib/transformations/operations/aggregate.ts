import type { DataRow, AggregateStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

export async function applyAggregate(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { groupBy, aggregations } = (step as AggregateStep).config;

  const groups = new Map<string, DataRow[]>();
  for (const row of rows) {
    const key = groupBy.map((f) => String(row[f] ?? "")).join("|||");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const result: DataRow[] = [];
  for (const [, groupRows] of groups) {
    const outRow: DataRow = {};

    for (const field of groupBy) {
      outRow[field] = groupRows[0][field];
    }

    for (const agg of aggregations) {
      const values = groupRows
        .map((r) => r[agg.field])
        .filter((v) => v != null);

      switch (agg.function) {
        case "count":
          outRow[agg.outputField] = groupRows.length;
          break;
        case "count_distinct":
          outRow[agg.outputField] = new Set(values.map(String)).size;
          break;
        case "sum":
          outRow[agg.outputField] = values.reduce(
            (acc: number, v) => acc + Number(v),
            0
          );
          break;
        case "avg": {
          const sum = values.reduce(
            (acc: number, v) => acc + Number(v),
            0
          );
          outRow[agg.outputField] = values.length > 0 ? sum / values.length : 0;
          break;
        }
        case "min":
          outRow[agg.outputField] =
            values.length > 0
              ? values.reduce((min, v) =>
                  Number(v) < Number(min) ? v : min
                )
              : null;
          break;
        case "max":
          outRow[agg.outputField] =
            values.length > 0
              ? values.reduce((max, v) =>
                  Number(v) > Number(max) ? v : max
                )
              : null;
          break;
      }
    }

    result.push(outRow);
  }

  return result;
}
