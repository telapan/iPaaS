"use client";

import { useState, useEffect } from "react";
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
  JoinStep,
} from "@/lib/transformations/types";

interface TableInfo {
  schema: string;
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface Props {
  step: JoinStep;
  connections: { id: string; name: string }[];
  sourceColumns: string[];
  onUpdate: (step: TransformationStep) => void;
}

export function JoinConfigurator({
  step,
  connections,
  sourceColumns,
  onUpdate,
}: Props) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [targetColumns, setTargetColumns] = useState<ColumnInfo[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);

  // Fetch tables when target connection changes
  useEffect(() => {
    if (step.config.targetConnectionId) {
      setLoadingTables(true);
      setTables([]);
      fetch(`/api/connections/${step.config.targetConnectionId}/tables`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setTables(data);
        })
        .finally(() => setLoadingTables(false));
    }
  }, [step.config.targetConnectionId]);

  // Fetch target table columns when target table changes
  useEffect(() => {
    if (
      step.config.targetConnectionId &&
      step.config.targetTable &&
      step.config.targetSchema
    ) {
      setLoadingColumns(true);
      setTargetColumns([]);
      fetch(
        `/api/connections/${step.config.targetConnectionId}/tables/${step.config.targetTable}?schema=${step.config.targetSchema}&limit=0`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.columns && Array.isArray(data.columns)) {
            setTargetColumns(data.columns);
          }
        })
        .finally(() => setLoadingColumns(false));
    }
  }, [
    step.config.targetConnectionId,
    step.config.targetTable,
    step.config.targetSchema,
  ]);

  function updateConfig(updates: Partial<JoinStep["config"]>) {
    onUpdate({
      ...step,
      config: { ...step.config, ...updates },
    });
  }

  function addJoinCondition() {
    updateConfig({
      on: [...step.config.on, { sourceField: "", targetField: "" }],
    });
  }

  function updateJoinCondition(
    index: number,
    field: "sourceField" | "targetField",
    value: string
  ) {
    const on = [...step.config.on];
    on[index] = { ...on[index], [field]: value };
    updateConfig({ on });
  }

  function removeJoinCondition(index: number) {
    updateConfig({
      on: step.config.on.filter((_, i) => i !== index),
    });
  }

  const targetColumnNames = targetColumns.map((c) => c.name);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Join Type</Label>
        <Select
          value={step.config.joinType}
          onValueChange={(v) =>
            updateConfig({
              joinType: v as "inner" | "left" | "right",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inner">Inner Join</SelectItem>
            <SelectItem value="left">Left Join</SelectItem>
            <SelectItem value="right">Right Join</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Connection</Label>
        <Select
          value={step.config.targetConnectionId}
          onValueChange={(v) => updateConfig({ targetConnectionId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select connection" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((conn) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {step.config.targetConnectionId && (
        <div className="space-y-2">
          <Label>
            Target Table{" "}
            {loadingTables && (
              <span className="text-muted-foreground">(loading...)</span>
            )}
          </Label>
          <Select
            value={
              step.config.targetTable
                ? `${step.config.targetSchema}.${step.config.targetTable}`
                : ""
            }
            onValueChange={(v) => {
              const [s, t] = v.split(".");
              updateConfig({ targetSchema: s, targetTable: t });
            }}
            disabled={loadingTables}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem
                  key={`${t.schema}.${t.name}`}
                  value={`${t.schema}.${t.name}`}
                >
                  {t.schema}.{t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>
          Join Conditions
          {loadingColumns && (
            <span className="ml-2 text-muted-foreground">
              (loading target columns...)
            </span>
          )}
        </Label>
        {step.config.on.map((cond, i) => (
          <div key={i} className="flex items-center gap-2">
            <Select
              value={cond.sourceField}
              onValueChange={(v) =>
                updateJoinCondition(i, "sourceField", v)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Source field" />
              </SelectTrigger>
              <SelectContent>
                {sourceColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">=</span>
            <Select
              value={cond.targetField}
              onValueChange={(v) =>
                updateJoinCondition(i, "targetField", v)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Target field" />
              </SelectTrigger>
              <SelectContent>
                {targetColumnNames.length > 0 ? (
                  targetColumnNames.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__placeholder" disabled>
                    Select a target table first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeJoinCondition(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addJoinCondition}>
          <Plus className="mr-1 h-4 w-4" />
          Add Join Condition
        </Button>
      </div>
    </div>
  );
}
