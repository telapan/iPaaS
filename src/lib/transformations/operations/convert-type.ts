import type { DataRow, ConvertTypeStep, TransformationStep } from "../types";
import type { TransformContext } from "../engine";

function convertValue(
  value: unknown,
  targetType: string,
  format?: string
): unknown {
  if (value == null) return null;

  switch (targetType) {
    case "string":
      if (value instanceof Date) {
        return format ? formatDate(value, format) : value.toISOString();
      }
      return String(value);
    case "integer": {
      const n = parseInt(String(value), 10);
      return isNaN(n) ? null : n;
    }
    case "float": {
      const n = parseFloat(String(value));
      return isNaN(n) ? null : n;
    }
    case "boolean": {
      const s = String(value).toLowerCase();
      if (["true", "1", "yes"].includes(s)) return true;
      if (["false", "0", "no", ""].includes(s)) return false;
      return null;
    }
    case "date":
    case "datetime": {
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return null;
      if (targetType === "date" && format) return formatDate(d, format);
      if (targetType === "date") return d.toISOString().split("T")[0];
      return d.toISOString();
    }
    default:
      return value;
  }
}

function formatDate(d: Date, format: string): string {
  const yyyy = d.getFullYear().toString();
  const MM = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const HH = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");

  return format
    .replace("YYYY", yyyy)
    .replace("MM", MM)
    .replace("DD", dd)
    .replace("HH", HH)
    .replace("mm", mm)
    .replace("ss", ss);
}

export async function applyConvertType(
  rows: DataRow[],
  step: TransformationStep,
  _ctx: TransformContext
): Promise<DataRow[]> {
  const { conversions } = (step as ConvertTypeStep).config;
  return rows.map((row) => {
    const newRow = { ...row };
    for (const conv of conversions) {
      if (conv.field in newRow) {
        newRow[conv.field] = convertValue(
          newRow[conv.field],
          conv.targetType,
          conv.format
        );
      }
    }
    return newRow;
  });
}
