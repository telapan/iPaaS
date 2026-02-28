"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Download,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PipelineConfig,
  TransformationStep,
  TransformationType,
} from "@/lib/transformations/types";
import { TRANSFORMATION_LABELS } from "@/lib/transformations/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepConfigurator } from "./StepConfigurator";
import { DataPreview } from "./DataPreview";
import { ExportDialog } from "./ExportDialog";
import { SqlPreview } from "./SqlPreview";

interface PipelineBuilderProps {
  pipelineId: string;
  initialConfig: PipelineConfig;
  connectionId: string;
  sourceTable: string;
  sourceSchema: string;
  connections: { id: string; name: string }[];
  crosswalks: { id: string; name: string }[];
}

function createDefaultStep(type: TransformationType): TransformationStep {
  const base = {
    id: crypto.randomUUID(),
    enabled: true,
  };

  switch (type) {
    case "exclude_fields":
      return { ...base, type, config: { fields: [] } };
    case "include_fields":
      return { ...base, type, config: { fields: [] } };
    case "convert_type":
      return { ...base, type, config: { conversions: [] } };
    case "rename_field":
      return { ...base, type, config: { renames: [] } };
    case "join":
      return {
        ...base,
        type,
        config: {
          joinType: "inner",
          targetConnectionId: "",
          targetTable: "",
          targetSchema: "dbo",
          on: [],
        },
      };
    case "calculation":
      return {
        ...base,
        type,
        config: {
          outputField: "",
          expression: { op: "literal", value: "" },
        },
      };
    case "filter":
      return {
        ...base,
        type,
        config: { conditions: [], logic: "and" as const },
      };
    case "aggregate":
      return { ...base, type, config: { groupBy: [], aggregations: [] } };
    case "sort":
      return { ...base, type, config: { sorts: [] } };
    case "deduplicate":
      return { ...base, type, config: { fields: [], keepFirst: true } };
    case "crosswalk":
      return {
        ...base,
        type,
        config: {
          crosswalkId: "",
          sourceField: "",
          outputField: "",
          unmatchedBehavior: "keep_original" as const,
        },
      };
  }
}

const transformationTypes: TransformationType[] = [
  "include_fields",
  "exclude_fields",
  "rename_field",
  "convert_type",
  "filter",
  "sort",
  "join",
  "calculation",
  "aggregate",
  "deduplicate",
  "crosswalk",
];

export function PipelineBuilder({
  pipelineId,
  initialConfig,
  connectionId,
  sourceTable,
  sourceSchema,
  connections,
  crosswalks,
}: PipelineBuilderProps) {
  const [config, setConfig] = useState<PipelineConfig>(
    initialConfig?.steps ? initialConfig : { steps: [] }
  );
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(
    null
  );
  const [previewStepIndex, setPreviewStepIndex] = useState<number>(-1);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const addStep = useCallback(
    (type: TransformationType) => {
      const newStep = createDefaultStep(type);
      setConfig((prev) => ({
        steps: [...prev.steps, newStep],
      }));
      setSelectedStepIndex(config.steps.length);
      setIsDirty(true);
    },
    [config.steps.length]
  );

  const updateStep = useCallback(
    (index: number, updated: TransformationStep) => {
      setConfig((prev) => ({
        steps: prev.steps.map((s, i) => (i === index ? updated : s)),
      }));
      setIsDirty(true);
    },
    []
  );

  const removeStep = useCallback((index: number) => {
    setConfig((prev) => ({
      steps: prev.steps.filter((_, i) => i !== index),
    }));
    setSelectedStepIndex(null);
    setIsDirty(true);
  }, []);

  const moveStep = useCallback((fromIndex: number, direction: "up" | "down") => {
    setConfig((prev) => {
      const steps = [...prev.steps];
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= steps.length) return prev;
      [steps[fromIndex], steps[toIndex]] = [steps[toIndex], steps[fromIndex]];
      return { steps };
    });
    setIsDirty(true);
  }, []);

  const toggleStep = useCallback((index: number) => {
    setConfig((prev) => ({
      steps: prev.steps.map((s, i) =>
        i === index ? { ...s, enabled: !s.enabled } : s
      ),
    }));
    setIsDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    const res = await fetch(`/api/pipelines/${pipelineId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    setSaving(false);
    if (res.ok) {
      setIsDirty(false);
      toast.success("Pipeline saved");
    } else {
      toast.error("Failed to save pipeline");
    }
  }, [config, pipelineId]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={!isDirty || saving} size="sm">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPreviewStepIndex(config.steps.length - 1);
            setPreviewKey((k) => k + 1);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview Result
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowExport(true)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        {isDirty && (
          <Badge variant="secondary" className="ml-2">
            Unsaved changes
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Step list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Steps</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Step
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {transformationTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => addStep(type)}
                  >
                    {TRANSFORMATION_LABELS[type]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Source data (step -1) */}
          <Card
            className={`cursor-pointer transition-colors ${
              previewStepIndex === -1 ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => {
              setPreviewStepIndex(-1);
              setPreviewKey((k) => k + 1);
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Source</Badge>
                <span>
                  {sourceSchema}.{sourceTable}
                </span>
              </div>
            </CardContent>
          </Card>

          {config.steps.map((step, index) => (
            <Card
              key={step.id}
              className={`cursor-pointer transition-colors ${
                selectedStepIndex === index
                  ? "border-primary"
                  : ""
              } ${
                previewStepIndex === index ? "bg-blue-50" : ""
              } ${!step.enabled ? "opacity-50" : ""}`}
              onClick={() => setSelectedStepIndex(index)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">
                      {TRANSFORMATION_LABELS[step.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewStepIndex(index);
                            setPreviewKey((k) => k + 1);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview data after this step</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStep(index, "up");
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Move step up</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStep(index, "down");
                          }}
                          disabled={index === config.steps.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Move step down</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={step.enabled}
                            onCheckedChange={() => toggleStep(index)}
                            className="scale-75"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {step.enabled ? "Disable step" : "Enable step"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(index);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete step</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {config.steps.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Add transformation steps using the button above
            </p>
          )}
        </div>

        {/* Step configurator */}
        <div className="lg:col-span-2">
          {selectedStepIndex !== null && config.steps[selectedStepIndex] ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Configure:{" "}
                  {
                    TRANSFORMATION_LABELS[
                      config.steps[selectedStepIndex].type
                    ]
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StepConfigurator
                  step={config.steps[selectedStepIndex]}
                  onUpdate={(updated) =>
                    updateStep(selectedStepIndex, updated)
                  }
                  connections={connections}
                  crosswalks={crosswalks}
                  connectionId={connectionId}
                  sourceTable={sourceTable}
                  sourceSchema={sourceSchema}
                  pipelineId={pipelineId}
                  stepIndex={selectedStepIndex}
                  config={config}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select a step to configure it, or add a new step to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Data Preview */}
      <DataPreview
        key={previewKey}
        pipelineId={pipelineId}
        stepIndex={previewStepIndex}
        config={config}
      />

      {/* SQL Preview */}
      <SqlPreview
        config={config}
        sourceSchema={sourceSchema}
        sourceTable={sourceTable}
      />

      {showExport && (
        <ExportDialog
          pipelineId={pipelineId}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
