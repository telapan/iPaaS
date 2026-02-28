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
  ConvertTypeStep,
} from "@/lib/transformations/types";

const targetTypes = [
  { value: "string", label: "String" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
];

interface Props {
  step: ConvertTypeStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function ConvertTypeConfigurator({ step, columns, onUpdate }: Props) {
  function addConversion() {
    onUpdate({
      ...step,
      config: {
        conversions: [
          ...step.config.conversions,
          { field: "", targetType: "string" as const },
        ],
      },
    });
  }

  function updateConversion(
    index: number,
    updates: Partial<ConvertTypeStep["config"]["conversions"][0]>
  ) {
    const conversions = [...step.config.conversions];
    conversions[index] = { ...conversions[index], ...updates };
    onUpdate({ ...step, config: { conversions } });
  }

  function removeConversion(index: number) {
    onUpdate({
      ...step,
      config: {
        conversions: step.config.conversions.filter((_, i) => i !== index),
      },
    });
  }

  return (
    <div className="space-y-3">
      <Label>Type conversions:</Label>
      {step.config.conversions.map((conv, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={conv.field}
            onValueChange={(v) => updateConversion(i, { field: v })}
          >
            <SelectTrigger className="w-36">
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
          <span className="text-muted-foreground">&rarr;</span>
          <Select
            value={conv.targetType}
            onValueChange={(v) =>
              updateConversion(i, {
                targetType: v as ConvertTypeStep["config"]["conversions"][0]["targetType"],
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targetTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(conv.targetType === "date" || conv.targetType === "datetime") && (
            <Input
              className="w-32"
              placeholder="YYYY-MM-DD"
              value={conv.format || ""}
              onChange={(e) =>
                updateConversion(i, { format: e.target.value || undefined })
              }
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeConversion(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addConversion}>
        <Plus className="mr-1 h-4 w-4" />
        Add Conversion
      </Button>
    </div>
  );
}
