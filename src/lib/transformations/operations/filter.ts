import type { DataRow, FilterStep, FilterCondition, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

function evaluateCondition(condition: FilterCondition, row: DataRow): boolean {
  const fieldVal = row[condition.field];
  const val = condition.value;

  switch (condition.operator) {
    case "eq":
      return fieldVal == val;
    case "neq":
      return fieldVal != val;
    case "gt":
      return Number(fieldVal) > Number(val);
    case "gte":
      return Number(fieldVal) >= Number(val);
    case "lt":
      return Number(fieldVal) < Number(val);
    case "lte":
      return Number(fieldVal) <= Number(val);
    case "contains":
      return String(fieldVal ?? "")
        .toLowerCase()
        .includes(String(val ?? "").toLowerCase());
    case "starts_with":
      return String(fieldVal ?? "")
        .toLowerCase()
        .startsWith(String(val ?? "").toLowerCase());
    case "ends_with":
      return String(fieldVal ?? "")
        .toLowerCase()
        .endsWith(String(val ?? "").toLowerCase());
    case "is_null":
      return fieldVal == null || fieldVal === "";
    case "is_not_null":
      return fieldVal != null && fieldVal !== "";
    case "in": {
      const list = Array.isArray(val) ? val : [];
      return list.some((v) => v == fieldVal);
    }
    default:
      return true;
  }
}

export async function applyFilter(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { conditions, logic } = (step as FilterStep).config;

  return rows.filter((row) => {
    const results = conditions.map((c) => evaluateCondition(c, row));
    if (logic === "and") return results.every(Boolean);
    return results.some(Boolean);
  });
}
