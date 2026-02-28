import type {
  DataRow,
  CalculationStep,
  CalculationExpression,
  FieldOrLiteral,
  FilterCondition,
  TransformationStep,
} from "../types";
import type { TransformContext } from "../engine";

function resolveValue(fol: FieldOrLiteral, row: DataRow): unknown {
  if (fol.type === "field") return row[fol.name];
  return fol.value;
}

function toNumber(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function evaluateCondition(cond: FilterCondition, row: DataRow): boolean {
  const fieldVal = row[cond.field];
  const val = cond.value;

  switch (cond.operator) {
    case "eq":
      return fieldVal == val;
    case "neq":
      return fieldVal != val;
    case "gt":
      return toNumber(fieldVal) > toNumber(val);
    case "gte":
      return toNumber(fieldVal) >= toNumber(val);
    case "lt":
      return toNumber(fieldVal) < toNumber(val);
    case "lte":
      return toNumber(fieldVal) <= toNumber(val);
    case "is_null":
      return fieldVal == null;
    case "is_not_null":
      return fieldVal != null;
    default:
      return false;
  }
}

function evaluateExpression(
  expr: CalculationExpression,
  row: DataRow
): unknown {
  switch (expr.op) {
    case "add":
      return toNumber(resolveValue(expr.left, row)) +
        toNumber(resolveValue(expr.right, row));
    case "subtract":
      return toNumber(resolveValue(expr.left, row)) -
        toNumber(resolveValue(expr.right, row));
    case "multiply":
      return toNumber(resolveValue(expr.left, row)) *
        toNumber(resolveValue(expr.right, row));
    case "divide": {
      const divisor = toNumber(resolveValue(expr.right, row));
      if (divisor === 0) return null;
      return toNumber(resolveValue(expr.left, row)) / divisor;
    }
    case "concat":
      return expr.fields
        .map((f) => String(resolveValue(f, row) ?? ""))
        .join(expr.separator ?? "");
    case "conditional":
      return evaluateCondition(expr.condition, row)
        ? resolveValue(expr.then, row)
        : resolveValue(expr.else, row);
    case "literal":
      return expr.value;
  }
}

export async function applyCalculation(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { outputField, expression } = (step as CalculationStep).config;
  return rows.map((row) => ({
    ...row,
    [outputField]: evaluateExpression(expression, row),
  }));
}
