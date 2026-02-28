"use client";

import { useState, useEffect } from "react";
import type {
  TransformationStep,
  PipelineConfig,
  ColumnInfo,
} from "@/lib/transformations/types";
import { FieldSelectorConfigurator } from "./configurators/FieldSelector";
import { RenameConfigurator } from "./configurators/RenameConfigurator";
import { ConvertTypeConfigurator } from "./configurators/ConvertTypeConfigurator";
import { FilterConfigurator } from "./configurators/FilterConfigurator";
import { JoinConfigurator } from "./configurators/JoinConfigurator";
import { CalculationConfigurator } from "./configurators/CalculationConfigurator";
import { AggregateConfigurator } from "./configurators/AggregateConfigurator";
import { SortConfigurator } from "./configurators/SortConfigurator";
import { DeduplicateConfigurator } from "./configurators/DeduplicateConfigurator";
import { CrosswalkConfigurator } from "./configurators/CrosswalkConfigurator";

interface StepConfiguratorProps {
  step: TransformationStep;
  onUpdate: (step: TransformationStep) => void;
  connections: { id: string; name: string }[];
  crosswalks: { id: string; name: string }[];
  connectionId: string;
  sourceTable: string;
  sourceSchema: string;
  pipelineId: string;
  stepIndex: number;
  config: PipelineConfig;
}

export function StepConfigurator({
  step,
  onUpdate,
  connections,
  crosswalks,
  pipelineId,
  stepIndex,
  config,
}: StepConfiguratorProps) {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  // Fetch columns available at this step by previewing the step before
  useEffect(() => {
    async function fetchColumns() {
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}/preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepIndex: stepIndex - 1,
            limit: 1,
            config,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setColumns(data.columns || []);
        }
      } catch {
        // Columns will be empty if preview fails
      }
    }
    fetchColumns();
  }, [pipelineId, stepIndex]);

  const columnNames = columns.map((c) => c.name);

  switch (step.type) {
    case "exclude_fields":
    case "include_fields":
      return (
        <FieldSelectorConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "rename_field":
      return (
        <RenameConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "convert_type":
      return (
        <ConvertTypeConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "filter":
      return (
        <FilterConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "join":
      return (
        <JoinConfigurator
          step={step}
          connections={connections}
          sourceColumns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "calculation":
      return (
        <CalculationConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "aggregate":
      return (
        <AggregateConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "sort":
      return (
        <SortConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "deduplicate":
      return (
        <DeduplicateConfigurator
          step={step}
          columns={columnNames}
          onUpdate={onUpdate}
        />
      );
    case "crosswalk":
      return (
        <CrosswalkConfigurator
          step={step}
          columns={columnNames}
          crosswalks={crosswalks}
          onUpdate={onUpdate}
        />
      );
    default:
      return (
        <p className="text-muted-foreground">
          Unknown step type
        </p>
      );
  }
}
