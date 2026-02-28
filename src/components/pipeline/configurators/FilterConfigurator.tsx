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
  FilterStep,
  FilterCondition,
} from "@/lib/transformations/types";

const operators = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not Equals" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "is_null", label: "Is Null/Empty" },
  { value: "is_not_null", label: "Is Not Null/Empty" },
];

interface Props {
  step: FilterStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function FilterConfigurator({ step, columns, onUpdate }: Props) {
  function addCondition() {
    const cond: FilterCondition = {
      field: "",
      operator: "eq",
      value: "",
    };
    onUpdate({
      ...step,
      config: {
        ...step.config,
        conditions: [...step.config.conditions, cond],
      },
    });
  }

  function updateCondition(
    index: number,
    updates: Partial<FilterCondition>
  ) {
    const conditions = [...step.config.conditions];
    conditions[index] = { ...conditions[index], ...updates };
    onUpdate({ ...step, config: { ...step.config, conditions } });
  }

  function removeCondition(index: number) {
    onUpdate({
      ...step,
      config: {
        ...step.config,
        conditions: step.config.conditions.filter((_, i) => i !== index),
      },
    });
  }

  function toggleLogic() {
    onUpdate({
      ...step,
      config: {
        ...step.config,
        logic: step.config.logic === "and" ? "or" : "and",
      },
    });
  }

  const needsValue = (op: string) =>
    !["is_null", "is_not_null"].includes(op);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Filter conditions</Label>
        <Button variant="outline" size="sm" onClick={toggleLogic}>
          {step.config.logic === "and" ? "AND" : "OR"}
        </Button>
      </div>

      {step.config.conditions.map((cond, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {step.config.logic}
            </span>
          )}
          <Select
            value={cond.field}
            onValueChange={(v) => updateCondition(i, { field: v })}
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
          <Select
            value={cond.operator}
            onValueChange={(v) =>
              updateCondition(i, {
                operator: v as FilterCondition["operator"],
              })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsValue(cond.operator) && (
            <Input
              className="w-32"
              placeholder="Value"
              value={String(cond.value ?? "")}
              onChange={(e) =>
                updateCondition(i, { value: e.target.value })
              }
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeCondition(i)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addCondition}>
        <Plus className="mr-1 h-4 w-4" />
        Add Condition
      </Button>
    </div>
  );
}
