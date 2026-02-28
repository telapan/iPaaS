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
  CalculationStep,
  CalculationExpression,
  FieldOrLiteral,
} from "@/lib/transformations/types";

const operations = [
  { value: "add", label: "Add (+)" },
  { value: "subtract", label: "Subtract (-)" },
  { value: "multiply", label: "Multiply (*)" },
  { value: "divide", label: "Divide (/)" },
  { value: "concat", label: "Concatenate" },
  { value: "literal", label: "Literal Value" },
];

interface Props {
  step: CalculationStep;
  columns: string[];
  onUpdate: (step: TransformationStep) => void;
}

function FieldOrLiteralInput({
  value,
  columns,
  onChange,
  label,
}: {
  value: FieldOrLiteral;
  columns: string[];
  onChange: (val: FieldOrLiteral) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Select
          value={value.type}
          onValueChange={(v) => {
            if (v === "field") {
              onChange({ type: "field", name: "" });
            } else {
              onChange({ type: "literal", value: "" });
            }
          }}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="field">Field</SelectItem>
            <SelectItem value="literal">Value</SelectItem>
          </SelectContent>
        </Select>
        {value.type === "field" ? (
          <Select
            value={value.name}
            onValueChange={(v) => onChange({ type: "field", name: v })}
          >
            <SelectTrigger className="w-32">
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
        ) : (
          <Input
            className="w-32"
            placeholder="Value"
            value={String(value.value)}
            onChange={(e) =>
              onChange({ type: "literal", value: e.target.value })
            }
          />
        )}
      </div>
    </div>
  );
}

export function CalculationConfigurator({ step, columns, onUpdate }: Props) {
  const expr = step.config.expression;

  function updateExpression(newExpr: CalculationExpression) {
    onUpdate({
      ...step,
      config: { ...step.config, expression: newExpr },
    });
  }

  const currentOp = expr.op;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Output Field Name</Label>
        <Input
          value={step.config.outputField}
          onChange={(e) =>
            onUpdate({
              ...step,
              config: { ...step.config, outputField: e.target.value },
            })
          }
          placeholder="calculated_field"
        />
      </div>

      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={currentOp}
          onValueChange={(v) => {
            switch (v) {
              case "add":
              case "subtract":
              case "multiply":
              case "divide":
                updateExpression({
                  op: v,
                  left: { type: "field", name: "" },
                  right: { type: "literal", value: 0 },
                });
                break;
              case "concat":
                updateExpression({
                  op: "concat",
                  fields: [{ type: "field", name: "" }],
                  separator: "",
                });
                break;
              case "literal":
                updateExpression({ op: "literal", value: "" });
                break;
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operations.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(currentOp === "add" ||
        currentOp === "subtract" ||
        currentOp === "multiply" ||
        currentOp === "divide") &&
        "left" in expr && (
          <div className="flex gap-4">
            <FieldOrLiteralInput
              value={expr.left}
              columns={columns}
              onChange={(v) => updateExpression({ ...expr, left: v })}
              label="Left Operand"
            />
            <FieldOrLiteralInput
              value={expr.right}
              columns={columns}
              onChange={(v) => updateExpression({ ...expr, right: v })}
              label="Right Operand"
            />
          </div>
        )}

      {currentOp === "concat" && "fields" in expr && (
        <div className="space-y-2">
          <Label className="text-xs">Separator</Label>
          <Input
            className="w-20"
            value={expr.separator || ""}
            onChange={(e) =>
              updateExpression({ ...expr, separator: e.target.value })
            }
            placeholder=" "
          />
          {expr.fields.map((f, i) => (
            <FieldOrLiteralInput
              key={i}
              value={f}
              columns={columns}
              onChange={(v) => {
                const fields = [...expr.fields];
                fields[i] = v;
                updateExpression({ ...expr, fields });
              }}
              label={`Part ${i + 1}`}
            />
          ))}
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() =>
              updateExpression({
                ...expr,
                fields: [...expr.fields, { type: "field", name: "" }],
              })
            }
          >
            + Add Part
          </button>
        </div>
      )}

      {currentOp === "literal" && "value" in expr && (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            value={String(expr.value)}
            onChange={(e) =>
              updateExpression({ op: "literal", value: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}
