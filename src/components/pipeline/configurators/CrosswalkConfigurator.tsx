"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TransformationStep,
  CrosswalkStep,
} from "@/lib/transformations/types";

interface Props {
  step: CrosswalkStep;
  columns: string[];
  crosswalks: { id: string; name: string }[];
  onUpdate: (step: TransformationStep) => void;
}

export function CrosswalkConfigurator({
  step,
  columns,
  crosswalks,
  onUpdate,
}: Props) {
  function updateConfig(updates: Partial<CrosswalkStep["config"]>) {
    onUpdate({ ...step, config: { ...step.config, ...updates } });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Crosswalk</Label>
        <Select
          value={step.config.crosswalkId}
          onValueChange={(v) => updateConfig({ crosswalkId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a crosswalk" />
          </SelectTrigger>
          <SelectContent>
            {crosswalks.map((cw) => (
              <SelectItem key={cw.id} value={cw.id}>
                {cw.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {crosswalks.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No crosswalks created yet. Go to Crosswalks to create one.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Source Field (to map from)</Label>
        <Select
          value={step.config.sourceField}
          onValueChange={(v) => updateConfig({ sourceField: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Output Field Name</Label>
        <Input
          value={step.config.outputField}
          onChange={(e) => updateConfig({ outputField: e.target.value })}
          placeholder="mapped_value"
        />
      </div>

      <div className="space-y-2">
        <Label>Unmatched Value Behavior</Label>
        <Select
          value={step.config.unmatchedBehavior}
          onValueChange={(v) =>
            updateConfig({
              unmatchedBehavior: v as CrosswalkStep["config"]["unmatchedBehavior"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keep_original">Keep Original Value</SelectItem>
            <SelectItem value="set_null">Set to Null</SelectItem>
            <SelectItem value="exclude_row">Exclude Row</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
