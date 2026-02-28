"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type {
  TransformationStep,
  AggregateStep,
} from "@/lib/transformations/types";

const aggFunctions = [
  { value: "sum", label: "Sum" },
  { value: "count", label: "Count" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count_distinct", label: "Count Distinct" },
];

interface Props {
  step: AggregateStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function AggregateConfigurator({ step, columns, onUpdate }: Props) {
  function toggleGroupBy(field: string) {
    const groupBy = step.config.groupBy.includes(field)
      ? step.config.groupBy.filter((f) => f !== field)
      : [...step.config.groupBy, field];
    onUpdate({ ...step, config: { ...step.config, groupBy } });
  }

  function addAggregation() {
    onUpdate({
      ...step,
      config: {
        ...step.config,
        aggregations: [
          ...step.config.aggregations,
          { field: "", function: "count" as const, outputField: "" },
        ],
      },
    });
  }

  function updateAggregation(
    index: number,
    updates: Partial<AggregateStep["config"]["aggregations"][0]>
  ) {
    const aggregations = [...step.config.aggregations];
    aggregations[index] = { ...aggregations[index], ...updates };
    onUpdate({ ...step, config: { ...step.config, aggregations } });
  }

  function removeAggregation(index: number) {
    onUpdate({
      ...step,
      config: {
        ...step.config,
        aggregations: step.config.aggregations.filter((_, i) => i !== index),
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Group By Fields</Label>
        <div className="grid grid-cols-3 gap-2">
          {columns.map((col) => (
            <label
              key={col}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs"
            >
              <input
                type="checkbox"
                checked={step.config.groupBy.includes(col)}
                onChange={() => toggleGroupBy(col)}
              />
              <span className="truncate font-mono">{col}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aggregations</Label>
        {step.config.aggregations.map((agg, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select
              value={agg.function}
              onValueChange={(v) =>
                updateAggregation(i, {
                  function: v as AggregateStep["config"]["aggregations"][0]["function"],
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aggFunctions.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={agg.field}
              onValueChange={(v) => updateAggregation(i, { field: v })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">as</span>
            <Input
              className="w-28"
              placeholder="Output name"
              value={agg.outputField}
              onChange={(e) =>
                updateAggregation(i, { outputField: e.target.value })
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAggregation(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addAggregation}>
          <Plus className="mr-1 h-4 w-4" />
          Add Aggregation
        </Button>
      </div>
    </div>
  );
}
