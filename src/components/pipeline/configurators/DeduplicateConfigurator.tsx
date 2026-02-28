"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  TransformationStep,
  DeduplicateStep,
} from "@/lib/transformations/types";

interface Props {
  step: DeduplicateStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function DeduplicateConfigurator({ step, columns, onUpdate }: Props) {
  function toggleField(field: string) {
    const fields = step.config.fields.includes(field)
      ? step.config.fields.filter((f) => f !== field)
      : [...step.config.fields, field];
    onUpdate({ ...step, config: { ...step.config, fields } });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Fields to check for duplicates (empty = all fields):
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {columns.map((col) => (
            <label
              key={col}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs"
            >
              <input
                type="checkbox"
                checked={step.config.fields.includes(col)}
                onChange={() => toggleField(col)}
              />
              <span className="truncate font-mono">{col}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Label>Keep first occurrence</Label>
        <Switch
          checked={step.config.keepFirst}
          onCheckedChange={(v) =>
            onUpdate({ ...step, config: { ...step.config, keepFirst: v } })
          }
        />
        <span className="text-sm text-muted-foreground">
          {step.config.keepFirst ? "Keep first" : "Keep last"}
        </span>
      </div>
    </div>
  );
}
