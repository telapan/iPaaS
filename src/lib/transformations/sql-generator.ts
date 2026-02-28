import type {
  PipelineConfig,
  TransformationStep,
  ExcludeFieldsStep,
  IncludeFieldsStep,
  ConvertTypeStep,
  RenameFieldStep,
  JoinStep,
  CalculationStep,
  FilterStep,
  AggregateStep,
  SortStep,
  DeduplicateStep,
  CrosswalkStep,
  FieldOrLiteral,
  CalculationExpression,
} from "./types";

function escapeIdentifier(name: string): string {
  return `[${name.replace(/]/g, "]]")}]`;
}

function resolveFieldOrLiteral(fol: FieldOrLiteral): string {
  if (fol.type === "field") return escapeIdentifier(fol.name);
  if (typeof fol.value === "number") return String(fol.value);
  return `'${String(fol.value).replace(/'/g, "''")}'`;
}

function generateExpressionSql(expr: CalculationExpression): string {
  switch (expr.op) {
    case "add":
      return `(${resolveFieldOrLiteral(expr.left)} + ${resolveFieldOrLiteral(expr.right)})`;
    case "subtract":
      return `(${resolveFieldOrLiteral(expr.left)} - ${resolveFieldOrLiteral(expr.right)})`;
    case "multiply":
      return `(${resolveFieldOrLiteral(expr.left)} * ${resolveFieldOrLiteral(expr.right)})`;
    case "divide":
      return `(${resolveFieldOrLiteral(expr.left)} / NULLIF(${resolveFieldOrLiteral(expr.right)}, 0))`;
    case "concat":
      return `CONCAT(${expr.fields.map(resolveFieldOrLiteral).join(
        expr.separator ? `, '${expr.separator.replace(/'/g, "''")}', ` : ", "
      )})`;
    case "conditional":
      return `CASE WHEN ${generateConditionSql(expr.condition)} THEN ${resolveFieldOrLiteral(expr.then)} ELSE ${resolveFieldOrLiteral(expr.else)} END`;
    case "literal":
      if (typeof expr.value === "number") return String(expr.value);
      return `'${String(expr.value).replace(/'/g, "''")}'`;
  }
}

function generateConditionSql(cond: {
  field: string;
  operator: string;
  value?: unknown;
}): string {
  const field = escapeIdentifier(cond.field);
  const val =
    cond.value == null
      ? "NULL"
      : typeof cond.value === "number"
        ? String(cond.value)
        : `'${String(cond.value).replace(/'/g, "''")}'`;

  switch (cond.operator) {
    case "eq":
      return `${field} = ${val}`;
    case "neq":
      return `${field} <> ${val}`;
    case "gt":
      return `${field} > ${val}`;
    case "gte":
      return `${field} >= ${val}`;
    case "lt":
      return `${field} < ${val}`;
    case "lte":
      return `${field} <= ${val}`;
    case "contains":
      return `${field} LIKE '%${String(cond.value ?? "").replace(/'/g, "''")}%'`;
    case "starts_with":
      return `${field} LIKE '${String(cond.value ?? "").replace(/'/g, "''")}%'`;
    case "ends_with":
      return `${field} LIKE '%${String(cond.value ?? "").replace(/'/g, "''")}'`;
    case "is_null":
      return `${field} IS NULL`;
    case "is_not_null":
      return `${field} IS NOT NULL`;
    case "in": {
      const list = Array.isArray(cond.value) ? cond.value : [];
      const items = list
        .map((v) =>
          typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`
        )
        .join(", ");
      return `${field} IN (${items})`;
    }
    default:
      return `${field} = ${val}`;
  }
}

const typeMap: Record<string, string> = {
  string: "NVARCHAR(MAX)",
  integer: "INT",
  float: "FLOAT",
  boolean: "BIT",
  date: "DATE",
  datetime: "DATETIME2",
};

function generateStepSql(
  step: TransformationStep,
  sourceAlias: string,
  sourceSchema: string,
  sourceTable: string
): string[] {
  const lines: string[] = [];

  switch (step.type) {
    case "include_fields": {
      const s = step as IncludeFieldsStep;
      if (s.config.fields.length > 0) {
        lines.push(
          `-- Include Fields\nSELECT ${s.config.fields.map(escapeIdentifier).join(", ")}`
        );
      }
      break;
    }
    case "exclude_fields": {
      const s = step as ExcludeFieldsStep;
      if (s.config.fields.length > 0) {
        lines.push(
          `-- Exclude Fields\n-- SELECT * except: ${s.config.fields.join(", ")}`
        );
      }
      break;
    }
    case "rename_field": {
      const s = step as RenameFieldStep;
      if (s.config.renames.length > 0) {
        const aliases = s.config.renames
          .map(
            (r) =>
              `${escapeIdentifier(r.from)} AS ${escapeIdentifier(r.to)}`
          )
          .join(",\n  ");
        lines.push(`-- Rename Fields\n  ${aliases}`);
      }
      break;
    }
    case "convert_type": {
      const s = step as ConvertTypeStep;
      if (s.config.conversions.length > 0) {
        const casts = s.config.conversions
          .map(
            (c) =>
              `CAST(${escapeIdentifier(c.field)} AS ${typeMap[c.targetType] || "NVARCHAR(MAX)"}) AS ${escapeIdentifier(c.field)}`
          )
          .join(",\n  ");
        lines.push(`-- Convert Types\n  ${casts}`);
      }
      break;
    }
    case "filter": {
      const s = step as FilterStep;
      if (s.config.conditions.length > 0) {
        const joiner = s.config.logic === "or" ? " OR " : " AND ";
        const where = s.config.conditions
          .map(generateConditionSql)
          .join(joiner);
        lines.push(`-- Filter\nWHERE ${where}`);
      }
      break;
    }
    case "join": {
      const s = step as JoinStep;
      const joinType =
        s.config.joinType === "inner"
          ? "INNER JOIN"
          : s.config.joinType === "left"
            ? "LEFT JOIN"
            : "RIGHT JOIN";
      const target = `${escapeIdentifier(s.config.targetSchema)}.${escapeIdentifier(s.config.targetTable)}`;
      const onClauses = s.config.on
        .map(
          (j) =>
            `${sourceAlias}.${escapeIdentifier(j.sourceField)} = t.${escapeIdentifier(j.targetField)}`
        )
        .join(" AND ");
      lines.push(
        `-- Join\n${joinType} ${target} AS t\n  ON ${onClauses || "/* specify join conditions */"}`
      );
      break;
    }
    case "calculation": {
      const s = step as CalculationStep;
      const expr = generateExpressionSql(s.config.expression);
      lines.push(
        `-- Calculation\n  ${expr} AS ${escapeIdentifier(s.config.outputField)}`
      );
      break;
    }
    case "aggregate": {
      const s = step as AggregateStep;
      const groupCols = s.config.groupBy.map(escapeIdentifier);
      const aggCols = s.config.aggregations.map((a) => {
        const fn = a.function === "count_distinct"
          ? `COUNT(DISTINCT ${escapeIdentifier(a.field)})`
          : `${a.function.toUpperCase()}(${escapeIdentifier(a.field)})`;
        return `${fn} AS ${escapeIdentifier(a.outputField)}`;
      });
      const selectCols = [...groupCols, ...aggCols].join(",\n  ");
      lines.push(`-- Aggregate\nSELECT ${selectCols}`);
      if (groupCols.length > 0) {
        lines.push(`GROUP BY ${groupCols.join(", ")}`);
      }
      break;
    }
    case "sort": {
      const s = step as SortStep;
      if (s.config.sorts.length > 0) {
        const orderBy = s.config.sorts
          .map(
            (sort) =>
              `${escapeIdentifier(sort.field)} ${sort.direction.toUpperCase()}`
          )
          .join(", ");
        lines.push(`-- Sort\nORDER BY ${orderBy}`);
      }
      break;
    }
    case "deduplicate": {
      const s = step as DeduplicateStep;
      const fields =
        s.config.fields.length > 0
          ? s.config.fields.map(escapeIdentifier).join(", ")
          : "*";
      const order = s.config.keepFirst ? "ASC" : "DESC";
      lines.push(
        `-- Deduplicate\n-- Using ROW_NUMBER() OVER (PARTITION BY ${fields} ORDER BY (SELECT NULL) ${order})\n-- WHERE rn = 1`
      );
      break;
    }
    case "crosswalk": {
      const s = step as CrosswalkStep;
      const behavior =
        s.config.unmatchedBehavior === "keep_original"
          ? `ISNULL(cw.targetValue, ${escapeIdentifier(s.config.sourceField)})`
          : s.config.unmatchedBehavior === "set_null"
            ? "cw.targetValue"
            : `cw.targetValue -- (exclude unmatched rows)`;
      lines.push(
        `-- Crosswalk: map ${escapeIdentifier(s.config.sourceField)} → ${escapeIdentifier(s.config.outputField)}\nLEFT JOIN crosswalk_${s.config.crosswalkId} AS cw\n  ON cw.sourceValue = ${escapeIdentifier(s.config.sourceField)}\n-- ${behavior} AS ${escapeIdentifier(s.config.outputField)}`
      );
      break;
    }
  }

  return lines;
}

export function generatePipelineSql(
  config: PipelineConfig,
  sourceSchema: string,
  sourceTable: string
): string {
  const enabledSteps = config.steps.filter((s) => s.enabled);

  if (enabledSteps.length === 0) {
    return `SELECT *\nFROM ${escapeIdentifier(sourceSchema)}.${escapeIdentifier(sourceTable)}`;
  }

  const sourceRef = `${escapeIdentifier(sourceSchema)}.${escapeIdentifier(sourceTable)}`;
  const alias = "src";

  const parts: string[] = [
    `-- Generated SQL representation of pipeline`,
    `-- Source: ${sourceSchema}.${sourceTable}`,
    `-- Steps: ${enabledSteps.length}`,
    ``,
  ];

  // Build a composite SQL-like representation
  const selectParts: string[] = [];
  const fromParts: string[] = [`FROM ${sourceRef} AS ${alias}`];
  const whereParts: string[] = [];
  const groupByParts: string[] = [];
  const orderByParts: string[] = [];
  const otherParts: string[] = [];

  for (const step of enabledSteps) {
    const stepLines = generateStepSql(step, alias, sourceSchema, sourceTable);
    for (const line of stepLines) {
      if (line.startsWith("-- Filter\nWHERE")) {
        whereParts.push(line.replace("-- Filter\nWHERE ", ""));
      } else if (line.startsWith("-- Sort\nORDER BY")) {
        orderByParts.push(line.replace("-- Sort\nORDER BY ", ""));
      } else if (line.startsWith("-- Join\n")) {
        fromParts.push(line.replace("-- Join\n", ""));
      } else if (line.startsWith("-- Aggregate\nSELECT")) {
        selectParts.push(line.replace("-- Aggregate\nSELECT ", ""));
      } else if (line.startsWith("GROUP BY")) {
        groupByParts.push(line.replace("GROUP BY ", ""));
      } else if (line.startsWith("-- Include Fields\nSELECT")) {
        selectParts.push(line.replace("-- Include Fields\nSELECT ", ""));
      } else {
        otherParts.push(line);
      }
    }
  }

  // Build final SQL
  if (selectParts.length > 0) {
    parts.push(`SELECT\n  ${selectParts.join(",\n  ")}`);
  } else {
    parts.push(`SELECT *`);
  }

  parts.push(fromParts.join("\n"));

  if (whereParts.length > 0) {
    parts.push(`WHERE ${whereParts.join("\n  AND ")}`);
  }

  if (groupByParts.length > 0) {
    parts.push(`GROUP BY ${groupByParts.join(", ")}`);
  }

  if (orderByParts.length > 0) {
    parts.push(`ORDER BY ${orderByParts.join(", ")}`);
  }

  if (otherParts.length > 0) {
    parts.push("");
    parts.push("/* Additional transformations (applied in-memory): */");
    parts.push(...otherParts);
  }

  return parts.join("\n");
}
