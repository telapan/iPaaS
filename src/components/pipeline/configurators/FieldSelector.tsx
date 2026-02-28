"use client";

import { Label } from "@/components/ui/label";
import type {
  TransformationStep,
  ExcludeFieldsStep,
  IncludeFieldsStep,
} from "@/lib/transformations/types";

interface FieldSelectorProps {
  step: ExcludeFieldsStep | IncludeFieldsStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function FieldSelectorConfigurator({
  step,
  columns,
  onUpdate,
}: FieldSelectorProps) {
  const selectedFields = step.config.fields;

  function toggleField(field: string) {
    const newFields = selectedFields.includes(field)
      ? selectedFields.filter((f) => f !== field)
      : [...selectedFields, field];

    onUpdate({
      ...step,
      config: { fields: newFields },
    });
  }

  function selectAll() {
    onUpdate({ ...step, config: { fields: [...columns] } });
  }

  function selectNone() {
    onUpdate({ ...step, config: { fields: [] } });
  }

  return (
    <div className="space-y-3">
      <Label>
        {step.type === "include_fields"
          ? "Select fields to include:"
          : "Select fields to exclude:"}
      </Label>
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="text-xs text-blue-600 hover:underline"
        >
          Select All
        </button>
        <button
          onClick={selectNone}
          className="text-xs text-blue-600 hover:underline"
        >
          Select None
        </button>
      </div>
      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No columns available. Save the pipeline and try again.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {columns.map((col) => (
            <label
              key={col}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedFields.includes(col)}
                onChange={() => toggleField(col)}
                className="rounded"
              />
              <span className="truncate font-mono text-xs">{col}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
