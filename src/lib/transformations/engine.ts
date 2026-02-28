import type {
  DataRow,
  TransformationStep,
  PipelineConfig,
  ColumnInfo,
} from "./types";
import { applyExcludeFields } from "./operations/exclude-fields";
import { applyIncludeFields } from "./operations/include-fields";
import { applyConvertType } from "./operations/convert-type";
import { applyRenameField } from "./operations/rename-field";
import { applyJoin } from "./operations/join";
import { applyCalculation } from "./operations/calculation";
import { applyFilter } from "./operations/filter";
import { applyAggregate } from "./operations/aggregate";
import { applySort } from "./operations/sort";
import { applyDeduplicate } from "./operations/deduplicate";
import { applyCrosswalk } from "./operations/crosswalk";

export interface TransformContext {
  userId: string;
  fetchTableData: (
    connectionId: string,
    schema: string,
    table: string
  ) => Promise<DataRow[]>;
  loadCrosswalk: (crosswalkId: string) => Promise<Map<string, string>>;
}

type OperationFn = (
  rows: DataRow[],
  step: TransformationStep,
  ctx: TransformContext
) => Promise<DataRow[]>;

const operationMap: Record<string, OperationFn> = {
  exclude_fields: applyExcludeFields,
  include_fields: applyIncludeFields,
  convert_type: applyConvertType,
  rename_field: applyRenameField,
  join: applyJoin,
  calculation: applyCalculation,
  filter: applyFilter,
  aggregate: applyAggregate,
  sort: applySort,
  deduplicate: applyDeduplicate,
  crosswalk: applyCrosswalk,
};

export async function executePipeline(
  sourceRows: DataRow[],
  config: PipelineConfig,
  ctx: TransformContext
): Promise<DataRow[]> {
  let rows = [...sourceRows];

  for (const step of config.steps) {
    if (!step.enabled) continue;

    const operation = operationMap[step.type];
    if (!operation) {
      throw new Error(`Unknown transformation type: ${step.type}`);
    }

    rows = await operation(rows, step, ctx);
  }

  return rows;
}

export async function executePipelineUpTo(
  sourceRows: DataRow[],
  config: PipelineConfig,
  stepIndex: number,
  ctx: TransformContext
): Promise<DataRow[]> {
  let rows = [...sourceRows];

  for (let i = 0; i <= stepIndex && i < config.steps.length; i++) {
    const step = config.steps[i];
    if (!step.enabled) continue;

    const operation = operationMap[step.type];
    if (!operation) {
      throw new Error(`Unknown transformation type: ${step.type}`);
    }

    rows = await operation(rows, step, ctx);
  }

  return rows;
}

export function inferColumns(rows: DataRow[]): ColumnInfo[] {
  if (rows.length === 0) return [];
  const first = rows[0];
  return Object.keys(first).map((name) => ({
    name,
    type: typeof first[name],
  }));
}
