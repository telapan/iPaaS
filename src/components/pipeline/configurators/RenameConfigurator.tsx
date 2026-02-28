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
  RenameFieldStep,
} from "@/lib/transformations/types";

interface Props {
  step: RenameFieldStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function RenameConfigurator({ step, columns, onUpdate }: Props) {
  function addRename() {
    onUpdate({
      ...step,
      config: {
        renames: [...step.config.renames, { from: "", to: "" }],
      },
    });
  }

  function updateRename(
    index: number,
    field: "from" | "to",
    value: string
  ) {
    const renames = [...step.config.renames];
    renames[index] = { ...renames[index], [field]: value };
    onUpdate({ ...step, config: { renames } });
  }

  function removeRename(index: number) {
    onUpdate({
      ...step,
      config: {
        renames: step.config.renames.filter((_, i) => i !== index),
      },
    });
  }

  return (
    <div className="space-y-3">
      <Label>Rename fields:</Label>
      {step.config.renames.map((rename, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={rename.from}
            onValueChange={(v) => updateRename(i, "from", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="From field" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">&rarr;</span>
          <Input
            className="w-40"
            placeholder="New name"
            value={rename.to}
            onChange={(e) => updateRename(i, "to", e.target.value)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeRename(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addRename}>
        <Plus className="mr-1 h-4 w-4" />
        Add Rename
      </Button>
    </div>
  );
}
