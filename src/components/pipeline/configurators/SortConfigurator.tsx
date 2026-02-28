"use client";

import { Button } from "@/components/ui/button";
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
  SortStep,
} from "@/lib/transformations/types";

interface Props {
  step: SortStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function SortConfigurator({ step, columns, onUpdate }: Props) {
  function addSort() {
    onUpdate({
      ...step,
      config: {
        sorts: [
          ...step.config.sorts,
          { field: "", direction: "asc" as const },
        ],
      },
    });
  }

  function updateSort(
    index: number,
    updates: Partial<SortStep["config"]["sorts"][0]>
  ) {
    const sorts = [...step.config.sorts];
    sorts[index] = { ...sorts[index], ...updates };
    onUpdate({ ...step, config: { sorts } });
  }

  function removeSort(index: number) {
    onUpdate({
      ...step,
      config: {
        sorts: step.config.sorts.filter((_, i) => i !== index),
      },
    });
  }

  return (
    <div className="space-y-3">
      <Label>Sort order:</Label>
      {step.config.sorts.map((sort, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={sort.field}
            onValueChange={(v) => updateSort(i, { field: v })}
          >
            <SelectTrigger className="w-40">
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
          <Select
            value={sort.direction}
            onValueChange={(v) =>
              updateSort(i, { direction: v as "asc" | "desc" })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => removeSort(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSort}>
        <Plus className="mr-1 h-4 w-4" />
        Add Sort
      </Button>
    </div>
  );
}
