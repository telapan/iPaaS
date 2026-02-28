export type TransformationType =
  | "exclude_fields"
  | "include_fields"
  | "convert_type"
  | "rename_field"
  | "join"
  | "calculation"
  | "filter"
  | "aggregate"
  | "sort"
  | "deduplicate"
  | "crosswalk";

export interface BaseStep {
  id: string;
  type: TransformationType;
  enabled: boolean;
}

export interface ExcludeFieldsStep extends BaseStep {
  type: "exclude_fields";
  config: { fields: string[] };
}

export interface IncludeFieldsStep extends BaseStep {
  type: "include_fields";
  config: { fields: string[] };
}

export interface ConvertTypeStep extends BaseStep {
  type: "convert_type";
  config: {
    conversions: Array<{
      field: string;
      targetType: "string" | "integer" | "float" | "boolean" | "date" | "datetime";
      format?: string;
    }>;
  };
}

export interface RenameFieldStep extends BaseStep {
  type: "rename_field";
  config: {
    renames: Array<{ from: string; to: string }>;
  };
}

export interface JoinStep extends BaseStep {
  type: "join";
  config: {
    joinType: "inner" | "left" | "right";
    targetConnectionId: string;
    targetTable: string;
    targetSchema: string;
    on: Array<{ sourceField: string; targetField: string }>;
    selectFields?: string[];
  };
}

export interface CalculationStep extends BaseStep {
  type: "calculation";
  config: {
    outputField: string;
    expression: CalculationExpression;
  };
}

export type CalculationExpression =
  | {
      op: "add" | "subtract" | "multiply" | "divide";
      left: FieldOrLiteral;
      right: FieldOrLiteral;
    }
  | { op: "concat"; fields: FieldOrLiteral[]; separator?: string }
  | {
      op: "conditional";
      condition: FilterCondition;
      then: FieldOrLiteral;
      else: FieldOrLiteral;
    }
  | { op: "literal"; value: string | number };

export type FieldOrLiteral =
  | { type: "field"; name: string }
  | { type: "literal"; value: string | number };

export interface FilterStep extends BaseStep {
  type: "filter";
  config: {
    conditions: FilterCondition[];
    logic: "and" | "or";
  };
}

export type FilterCondition = {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "is_null"
    | "is_not_null"
    | "in";
  value?: string | number | boolean | (string | number)[];
};

export interface AggregateStep extends BaseStep {
  type: "aggregate";
  config: {
    groupBy: string[];
    aggregations: Array<{
      field: string;
      function: "sum" | "count" | "avg" | "min" | "max" | "count_distinct";
      outputField: string;
    }>;
  };
}

export interface SortStep extends BaseStep {
  type: "sort";
  config: {
    sorts: Array<{ field: string; direction: "asc" | "desc" }>;
  };
}

export interface DeduplicateStep extends BaseStep {
  type: "deduplicate";
  config: {
    fields: string[];
    keepFirst: boolean;
  };
}

export interface CrosswalkStep extends BaseStep {
  type: "crosswalk";
  config: {
    crosswalkId: string;
    sourceField: string;
    outputField: string;
    unmatchedBehavior: "keep_original" | "set_null" | "exclude_row";
  };
}

export type TransformationStep =
  | ExcludeFieldsStep
  | IncludeFieldsStep
  | ConvertTypeStep
  | RenameFieldStep
  | JoinStep
  | CalculationStep
  | FilterStep
  | AggregateStep
  | SortStep
  | DeduplicateStep
  | CrosswalkStep;

export interface PipelineConfig {
  steps: TransformationStep[];
}

export type DataRow = Record<string, unknown>;

export interface ColumnInfo {
  name: string;
  type: string;
}

export const TRANSFORMATION_LABELS: Record<TransformationType, string> = {
  exclude_fields: "Exclude Fields",
  include_fields: "Include Fields",
  convert_type: "Convert Data Types",
  rename_field: "Rename Fields",
  join: "Join Tables",
  calculation: "Calculation",
  filter: "Filter Rows",
  aggregate: "Aggregate",
  sort: "Sort",
  deduplicate: "Deduplicate",
  crosswalk: "Crosswalk",
};
